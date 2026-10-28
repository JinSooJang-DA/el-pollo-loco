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
        this.loadCurrentLevel(levelNumber);
        this.initHudIcons();
        this.scaleEnemyDifficulty();
        this.setWorld();
        this.run();
    }

    /**
     * Loads the corresponding level data.
     * @param {number} levelNumber The level to load.
     */
    loadCurrentLevel(levelNumber) {
        const levels = [level1, level2, level3, level4, level5];
        this.level = levels[levelNumber - 1] || level1;
    }

    /** Initializes the HUD icons. */
    initHudIcons() {
        this.bottleIcon = new Image();
        this.bottleIcon.src = 'img/salsa-hud.webp';
        this.coinIcon = new Image();
        this.coinIcon.src = 'img/coin-full.webp';
    }

    /** Scales enemy speed and health based on the level. */
    scaleEnemyDifficulty() {
        let speedMultiplier = 1 + (this.levelNumber - 1) * 0.2;
        this.level.enemies.forEach(enemy => {
            if (enemy instanceof SmallChicken) {
                enemy.speed *= speedMultiplier;
            } else if (enemy instanceof Chicken) {
                enemy.speed *= speedMultiplier;
                enemy.energy = this.levelNumber;
                enemy.maxEnergy = this.levelNumber;
            }
        });
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
            currentBgm !== audioHub.bgmBoss && !this.gameEnded) {
            playBgm(audioHub.bgmBoss);
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

    /**
     * Creates and configures the Endboss instance.
     * @returns {Endboss} The configured Endboss instance.
     */
    createConfiguredBoss() {
        let boss = new Endboss();
        let bossHealth = { 1: 50, 2: 70, 3: 50, 4: 100, 5: 100 };
        boss.energy = bossHealth[this.levelNumber] || 50;
        boss.maxEnergy = boss.energy;
        this.statusBarEndboss.setPercentage(100);
        let distance = 500;
        boss.x = this.character.otherDirection ? this.character.x - distance : this.character.x + distance;
        boss.x = Math.max(0, Math.min(boss.x, this.level.level_end_x - boss.width));
        return boss;
    }

    /** Spawns and configures the boss after all regular enemies are defeated. */
    checkBossSpawn() {
        if (this.bossSpawned || this.gameEnded) return;

        let remainingEnemies = this.level.enemies.filter(
            enemy => !enemy.isDead()
        );

        if (remainingEnemies.length === 0) {
            this.bossSpawned = true;
            this.level.enemies.push(this.createConfiguredBoss());
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
            this.executeBossDefeat();
        }
    }

    /** Finalizes game states and invokes level completion flow. */
    executeBossDefeat() {
        this.gameEnded = true;
        this.stopDrawing = true;
        stopAllIntervals();
        if (currentBgm) currentBgm.pause();
        stopSoundEffects();
        finishCompletedLevel(this);
    }

    /**
     * Handles the logic for death audio ending.
     * @param {HTMLAudioElement} deathAudio The death sound being played.
     * @param {Function} onFinish Callback run when the sound ends.
     */
    handleDeathAudioEnd(deathAudio, onFinish) {
        let deathFinished = false;
        let triggerFinish = () => {
            if (deathFinished || this !== world || !this.gameEnded) return;
            deathFinished = true;
            onFinish();
        };
        let finishFallback = () => window.setTimeout(triggerFinish, 1000);
        
        deathAudio.voice.addEventListener('ended', triggerFinish, { once: true });
        deathAudio.voice.addEventListener('error', finishFallback, { once: true });
        deathAudio.playback.then(played => { if (!played) finishFallback(); });
    }

    /** Starts Pepe's one-time death voice and finishes safely without audio. */
    startPepeDeathSequence() {
        if (this.gameEnded) return;

        this.gameEnded = true;
        this.character.resetIdleTimer();
        if (currentBgm) currentBgm.pause();

        let deathAudio = playRandomPepeDeadVoice();
        
        this.handleDeathAudioEnd(deathAudio, () => {
            playBgm(audioHub.bgmLost);
            this.showEndScreen('img/You won, you lost/You lost.png');
        });
    }

    /**
     * Updates the end screen view state based on victory or loss.
     * @param {boolean} isVictory True if the player won.
     * @param {string} imagePath Path of the end screen image.
     */
    updateEndScreenView(isVictory, imagePath) {
        let endScreenImg = document.getElementById('endScreenImg');
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
    }

    /**
     * Terminates rendering and logic loops if no revive is available.
     * @param {boolean} canRevive True if a sombrero revive is available.
     */
    haltGameIfNotRevivable(canRevive) {
        if (!canRevive) {
            this.stopDrawing = true;
            stopAllIntervals();
        }
    }

    /**
     * Configures and displays the action buttons available after a run.
     * @param {boolean} canRevive True if a sombrero revive is available.
     */
    showRestartUI(canRevive) {
        document.getElementById('retryLevelBtn')?.classList.toggle('d-none', !canRevive);
        document.getElementById('restartScreen')?.classList.remove('d-none');
        if (typeof focusGameOverButton === 'function') {
            focusGameOverButton(canRevive);
        }
    }

    /**
     * Shows the loss or victory result UI.
     * @param {string} imagePath The result image to display for a loss.
     * @param {boolean} [isVictory=false] Whether to show the victory flow.
     */
    showEndScreen(imagePath, isVictory = false) {
        if (this !== world) return;

        let canRevive = this.character.isDead() && sombreros > 0;
        this.haltGameIfNotRevivable(canRevive);
        this.updateEndScreenView(isVictory, imagePath);
        this.showRestartUI(canRevive);
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