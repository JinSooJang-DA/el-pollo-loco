
/**
 * Represents the game world.
 */
class World {
    character = new Character();
    level;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar();
    statusBarBottle = new StatusBarBottle();
    statusBarCoin = new StatusBarCoin();
    statusBarEndboss = new StatusBarEndboss();
    throwableObjects = [];
    levelNumber = 1;
    canThrow = true;
    availableBottles = 0;
    bottleRespawnTime = 10000;
    maxBottles = 5;
    collectedCoins = 0;
    maxCoins = 4;
    bossSpawned = false;
    gameEnded = false;
    stopDrawing = false;

    /**
     * Creates one playable level world.
     * @param {HTMLCanvasElement} canvas The game drawing surface.
     * @param {Keyboard} keyboard The shared keyboard state.
     * @param {number} [levelNumber=1] The level to load.
     */
    constructor(canvas, keyboard, levelNumber = 1) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.levelNumber = levelNumber;

        if (levelNumber === 1) this.level = level1;
        else if (levelNumber === 2) this.level = level2;
        else if (levelNumber === 3) this.level = level3;
        else if (levelNumber === 4) this.level = level4;
        else if (levelNumber === 5) this.level = level5;

        this.bottleIcon = new Image();
        this.bottleIcon.src = 'img/salsa-hud.webp';
        this.coinIcon = new Image();
        this.coinIcon.src = 'img/coin-full.webp';



        this.level.enemies.forEach(enemy => {
            let speedMultiplier = 1 + (this.levelNumber - 1) * 0.2;

            if (enemy instanceof SmallChicken) {
                // 병아리: 기존 속도 유지
                enemy.speed *= speedMultiplier;
            } else if (enemy instanceof Chicken) {
                // 일반닭: 레벨별 증가
                enemy.speed *= speedMultiplier;

                // 일반닭 체력은 기존 레벨별 설정 유지
                enemy.energy = this.levelNumber;
                enemy.maxEnergy = this.levelNumber;
            }
        });



        this.setWorld();
        this.run();
    }

    /** Connects Pepe to this world instance. */
    setWorld() {
        this.character.world = this;
    }

    /** Starts the existing 50 ms game-state check loop. */
    run() {
        setInterval(() => {
            if (this !== world || this.gameEnded || isPaused) return;

            this.checkCollisions();
            this.checkBossSpawn();
            this.checkThrowObjects();
            this.checkGameOver();

            if (this !== world || this.gameEnded) return;
            this.checkBossMusicTrigger();
        }, 50);
    }

    /** Switches to boss music after the boss first engages Pepe. */
    checkBossMusicTrigger() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);

        if (endboss && endboss.hadFirstContact &&
            currentBgm !== AUDIO_HUB.bgmBoss && !this.gameEnded) {
            playBgm(AUDIO_HUB.bgmBoss);
        }
    }

    /**
     * Returns the boss damage rule for this level.
     * @returns {string} The allowed attack mode.
     */
    getBossAttackMode() {
        if (this.levelNumber === 1) return 'both';
        if (this.levelNumber === 2) return 'stomp';
        if (this.levelNumber === 3) return 'bottle';
        if (this.levelNumber === 4) return 'stomp';
        if (this.levelNumber === 5) return 'bottle';
        return 'both';
    }

    /** Spawns and configures the boss after all regular enemies are defeated. */
    checkBossSpawn() {
        if (this.bossSpawned || this.gameEnded) return;

        let remainingEnemies = this.level.enemies.filter(
            enemy => !enemy.isDead()
        );

        if (remainingEnemies.length === 0) {
            this.bossSpawned = true;
            let boss = new Endboss();

            let bossHealth = {
                1: 50,
                2: 70,
                3: 50,
                4: 100,
                5: 100
            };

            boss.energy = bossHealth[this.levelNumber] || 50;
            boss.maxEnergy = boss.energy;
            this.statusBarEndboss.setPercentage(100);

            let distance = 500;

            if (this.character.otherDirection) {
                boss.x = this.character.x - distance;
            } else {
                boss.x = this.character.x + distance;
            }

            boss.x = Math.max(
                0,
                Math.min(boss.x, this.level.level_end_x - boss.width)
            );

            this.level.enemies.push(boss);
        }
    }

    /** Starts Pepe's loss flow or completes a level after the boss dies. */
    checkGameOver() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);

        if (this.character.isDead() && !this.gameEnded) {
            this.startPepeDeathSequence();
            return;
        }

        if (endboss && endboss.deathAnimationFinished && !this.gameEnded) {
            this.gameEnded = true;
            this.stopDrawing = true;
            stopAllIntervals();
            if (currentBgm) currentBgm.pause();
            stopSoundEffects();

            finishCompletedLevel(this);
        }
    }

    /** Starts Pepe's one-time death voice and finishes safely without audio. */
    startPepeDeathSequence() {
        if (this.gameEnded) return;

        this.gameEnded = true;
        this.character.resetIdleTimer();
        if (currentBgm) currentBgm.pause();

        let deathAudio = playRandomPepeDeadVoice();
        let deathFinished = false;
        let finishDeath = () => {
            if (deathFinished || this !== world || !this.gameEnded) return;

            deathFinished = true;

            playBgm(AUDIO_HUB.bgmLost);
            this.showEndScreen('img/You won, you lost/You lost.png');
        };
        let finishAfterDeathAnimation = () => {
            // Six DEAD frames run every 150 ms; leave a small margin for the last frame.
            window.setTimeout(finishDeath, 1000);
        };

        deathAudio.voice.addEventListener('ended', finishDeath, { once: true });
        deathAudio.voice.addEventListener('error', finishAfterDeathAnimation, { once: true });
        deathAudio.playback.then(played => {
            if (!played) finishAfterDeathAnimation();
        });
    }

    /**
     * Shows the loss or victory result UI.
     * @param {string} imagePath The result image to display for a loss.
     * @param {boolean} [isVictory=false] Whether to show the victory flow.
     */
    showEndScreen(imagePath, isVictory = false) {
        if (this !== world) return;

        let canRevive = this.character.isDead() && sombreros > 0;
        if (!canRevive) {
            this.stopDrawing = true;
            stopAllIntervals();
        }

        let endScreenImg = document.getElementById('endScreenImg');
        let restartScreen = document.getElementById('restartScreen');
        let endCredits = document.getElementById('endCredits');

        if (isVictory) {
            endScreenImg.classList.add('d-none');
            endCredits.classList.remove('d-none');
            playEndVideo();
        } else {
            stopEndVideo();
            endCredits.classList.add('d-none');
            this.setEndScreenImage(endScreenImg, imagePath);
        }

        let retryButton = document.getElementById('retryLevelBtn');
        let canRetry = canRevive;

        if (retryButton) {
            retryButton.classList.toggle('d-none', !canRetry);
        }

        if (restartScreen) restartScreen.classList.remove('d-none');

        if (typeof focusGameOverButton === 'function') {
            focusGameOverButton(canRetry);
        }
    }

    /**
     * Loads a result image and falls back to the standard game-over asset.
     * @param {HTMLImageElement} imgElement The result image element.
     * @param {string} imagePath The preferred image path.
     */
    setEndScreenImage(imgElement, imagePath) {
        if (!imgElement) return;

        imgElement.src = imagePath;
        imgElement.onload = () => imgElement.classList.remove('d-none');
        imgElement.onerror = () => {
            imgElement.onerror = null;
            imgElement.src = 'img/9_intro_outro_screens/game_over/game over.png';
            imgElement.classList.remove('d-none');
        };
    }
}
