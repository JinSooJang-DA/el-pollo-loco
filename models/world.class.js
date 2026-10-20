
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
        this.bottleIcon.src = 'img/6_salsa_bottle/salsa_bottle.png';
        this.coinIcon = new Image();
        this.coinIcon.src = 'img/8_coin/coin_1.png';



        this.level.enemies.forEach(enemy => {
            let speedMultiplier = 1 + (this.levelNumber - 1) * 0.2;

            if (enemy instanceof SmallChicken) {
                // 병아리: 기존 속도 유지
                enemy.speed *= speedMultiplier;
            } else if (enemy instanceof Chicken) {
                // 일반닭: 기본 속도 2배 + 레벨별 증가
                enemy.speed *= 2 * speedMultiplier;

                // 일반닭 체력은 기존 레벨별 설정 유지
                enemy.energy = this.levelNumber;
                enemy.maxEnergy = this.levelNumber;
            }
        });



        this.setWorld();
        this.run();
    }

    setWorld() {
        this.character.world = this;
    }

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

    checkBossMusicTrigger() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);

        if (endboss && endboss.hadFirstContact &&
            currentBgm !== AUDIO_HUB.bgmBoss && !this.gameEnded) {
            playBgm(AUDIO_HUB.bgmBoss);
        }
    }

    getBossAttackMode() {
        if (this.levelNumber === 1) return 'both';
        if (this.levelNumber === 2) return 'stomp';
        if (this.levelNumber === 3) return 'bottle';
        if (this.levelNumber === 4) return 'stomp';
        if (this.levelNumber === 5) return 'bottle';
        return 'both';
    }

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

    checkGameOver() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);

        if (this.character.isDead() && !this.gameEnded) {
            this.gameEnded = true;
            playSound(AUDIO_HUB.pepeDead);
            playBgm(AUDIO_HUB.bgmLost);

            setTimeout(() => {
                if (this === world) {
                    this.showEndScreen('img/You won, you lost/You lost.png');
                }
            }, 1500);
            return;
        }

        if (endboss && endboss.deathAnimationFinished && !this.gameEnded) {
            this.gameEnded = true;
            stopSoundEffects();
            playBgm(AUDIO_HUB.bgmWin);

            finishCompletedLevel(this);
        }
    }

    showEndScreen(imagePath) {
        if (this !== world) return;

        this.stopDrawing = true;
        stopAllIntervals();

        let endScreenImg = document.getElementById('endScreenImg');
        let restartScreen = document.getElementById('restartScreen');

        this.setEndScreenImage(endScreenImg, imagePath);

        let retryButton = document.getElementById('retryLevelBtn');

        if (retryButton) {
            let canRetry = this.character.isDead() && sombreros > 0;
            retryButton.classList.toggle('d-none', !canRetry);
        }

        if (restartScreen) restartScreen.classList.remove('d-none');
    }

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
