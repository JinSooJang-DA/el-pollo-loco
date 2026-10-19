
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
    maxCoins = 5;
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
            if (enemy instanceof Chicken) {
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

    /**
     * Defines which attacks can damage the boss.
     */
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

            // Every completed level plays the victory music.
            playBgm(AUDIO_HUB.bgmWin);

            if (this.levelNumber < 5) {
                startLevel(this.levelNumber + 1);
            } else {
                this.showEndScreen('img/You won, you lost/You win B.png');
            }
        }
    }

    showEndScreen(imagePath) {
        if (this !== world) return;

        this.stopDrawing = true;
        stopAllIntervals();

        let endScreenImg = document.getElementById('endScreenImg');
        let restartScreen = document.getElementById('restartScreen');

        this.setEndScreenImage(endScreenImg, imagePath);

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

    checkThrowObjects() {
        if (this.keyboard.D && this.canThrow && this.availableBottles > 0) {
            let offset = this.character.otherDirection ? 0 : 60;
            let bottle = new ThrowableObject(
                this.character.x + offset,
                this.character.y + 140,
                this.character.otherDirection
            );

            this.throwableObjects.push(bottle);
            this.availableBottles--;
            playSound(AUDIO_HUB.throw);
            this.updateBottleBar();
            this.cooldownThrow();
        }
    }

    updateBottleBar() {
        let percentage = (this.availableBottles / this.maxBottles) * 100;
        this.statusBarBottle.setPercentage(percentage);
    }

    cooldownThrow() {
        this.canThrow = false;
        setTimeout(() => {
            if (this === world && !this.gameEnded) this.canThrow = true;
        }, 1000);
    }

    checkCollisions() {
        this.checkCharacterCollisions();
        this.checkBottleCollisions();
        this.checkCollectBottles();
        this.checkCollectCoins();
    }

    checkCharacterCollisions() {
        this.level.enemies.forEach(enemy => {
            let isAlive = typeof enemy.isDead === 'function'
                ? !enemy.isDead() : !enemy.isDead;

            if (isAlive && this.character.isColliding(enemy)) {
                this.handleEnemyContact(enemy);
            }
        });
    }

    handleEnemyContact(enemy) {
        if (enemy instanceof SmallChicken) {
            if (!this.character.isHurt() && !this.character.isDead()) {
                playSound(AUDIO_HUB.smallChickenDead);
            }
            this.hurtCharacter();
            return;
        }

        if (enemy instanceof Endboss) {
            let pepeFeet = this.character.y + this.character.height
                - this.character.offset.bottom;
            let bossHead = enemy.y + enemy.height * 0.13;
            let bossHeadBottom = enemy.y + enemy.height * 0.43;
            let pepeLeft = this.character.x + this.character.offset.left;
            let pepeRight = this.character.x + this.character.width
                - this.character.offset.right;

            let headLeft = enemy.otherDirection
                ? enemy.x + enemy.width * 0.52
                : enemy.x + enemy.width * 0.08;
            let headRight = headLeft + enemy.width * 0.38;

            let isStomping = this.character.speedY < 0 &&
                pepeFeet >= bossHead &&
                pepeFeet <= bossHeadBottom &&
                pepeRight > headLeft &&
                pepeLeft < headRight;

            if (isStomping) {
                let attackMode = this.getBossAttackMode();

                // Level 3 and 5: stomping does not damage the boss.
                if (attackMode === 'bottle') {
                    this.character.speedY = 15;
                    return;
                }

                // Level 1, 2 and 4: stomping can damage the boss.
                if (Date.now() - enemy.lastHit >= 3000) {
                    enemy.energy = Math.max(0, enemy.energy - 20);
                    enemy.lastHit = Date.now();

                    this.statusBarEndboss.setPercentage(
                        (enemy.energy / enemy.maxEnergy) * 100
                    );

                    playSound(AUDIO_HUB.bossHurt);
                    this.character.speedY = 15;
                }
                return;
            }

            if (Date.now() - enemy.lastHit < 2000) return;
            this.hurtCharacter(40);
            return;
        }

        if (this.character.speedY < 0 ||
            this.character.isAboveGround()) {
            this.stompEnemy(enemy);
        } else {
            this.hurtCharacter();
        }
    }


    hurtCharacter(damage = 40) {
        if (this.character.isHurt() || this.character.isDead()) return;

        let coinsUsed = Math.min(
            this.collectedCoins,
            Math.ceil(damage / 10)
        );

        this.collectedCoins -= coinsUsed;
        this.statusBarCoin.setPercentage(
            (this.collectedCoins / this.maxCoins) * 100
        );

        let remainingDamage = Math.max(0, damage - coinsUsed * 10);

        this.character.energy = Math.max(
            0, this.character.energy - remainingDamage
        );

        this.statusBar.setPercentage(this.character.energy);
        this.character.lastHit = Date.now();

        playSound(AUDIO_HUB.pepeHurt);
    }


    stompEnemy(enemy) {
        if (!(enemy instanceof Chicken)) return;

        let now = Date.now();
        if (now - enemy.lastStomp < enemy.stompCooldown) return;

        enemy.lastStomp = now;
        enemy.energy -= 1;
        this.character.speedY = 15;

        if (enemy.energy <= 0) {
            enemy.energy = 0;
            playSound(AUDIO_HUB.chickenDead1);
            enemy.die();
            this.removeEnemyAfterDelay(enemy, 500);
        } else {
            playSound(AUDIO_HUB.chickenStomp);
            enemy.showStompReaction();
        }
    }

    removeEnemyAfterDelay(enemy, delay) {
        let currentLevel = this.level;
        setTimeout(() => {
            if (this !== world || this.level !== currentLevel) return;
            let idx = currentLevel.enemies.indexOf(enemy);
            if (idx > -1) currentLevel.enemies.splice(idx, 1);
        }, delay);
    }

    checkBottleCollisions() {
        this.throwableObjects.forEach(bottle => {
            this.level.enemies.forEach(enemy => {
                let isAlive = typeof enemy.isDead === 'function'
                    ? !enemy.isDead() : !enemy.isDead;

                if (isAlive && !bottle.isSplashed &&
                    bottle.isColliding(enemy)) {
                    this.handleBottleImpact(bottle, enemy);
                }
            });
        });
    }

    handleBottleImpact(bottle, enemy) {
        bottle.isSplashed = true;
        if (typeof bottle.splash === 'function') bottle.splash();

        if (enemy instanceof Endboss) {
            enemy.hadFirstContact = true;
            let attackMode = this.getBossAttackMode();

            // Level 2 and 4: bottles splash but cause no damage.
            if (attackMode === 'stomp') {
                this.removeBottleAfterDelay(bottle, 100);
                return;
            }

            // Level 1, 3 and 5: bottles can damage the boss.
            if (enemy.isHitOnHead(bottle) &&
                Date.now() - enemy.lastHit >= 3000) {
                enemy.hit();
                playSound(AUDIO_HUB.bossHurt);

                this.statusBarEndboss.setPercentage(
                    (enemy.energy / enemy.maxEnergy) * 100
                );
            }
        } else {
            if (enemy instanceof SmallChicken) {
                playSound(AUDIO_HUB.smallChickenDead);
            } else {
                playSound(AUDIO_HUB.chickenDead);
            }

            if (typeof enemy.die === 'function') enemy.die();
            this.removeEnemyAfterDelay(enemy, 500);
        }

        this.removeBottleAfterDelay(bottle, 100);
    }

    removeBottleAfterDelay(bottle, delay) {
        setTimeout(() => {
            if (this !== world) return;
            let idx = this.throwableObjects.indexOf(bottle);
            if (idx > -1) this.throwableObjects.splice(idx, 1);
        }, delay);
    }

    checkCollectBottles() {
        if (!this.level.bottles) return;

        this.level.bottles.forEach((bottle, idx) => {
            if (this.character.isColliding(bottle) &&
                this.availableBottles < this.maxBottles) {
                this.availableBottles++;
                this.level.bottles.splice(idx, 1);
                playSound(AUDIO_HUB.bottleCollect);
                this.updateBottleBar();
                this.respawnBottle(bottle);
            }
        });
    }

    respawnBottle(bottle) {
        let currentLevel = this.level;
        setTimeout(() => {
            if (this === world && !this.gameEnded &&
                this.level === currentLevel) {
                currentLevel.bottles.push(bottle);
            }
        }, this.bottleRespawnTime);
    }


    checkCollectCoins() {
        if (!this.level.coins) return;

        this.level.coins.forEach((coin, idx) => {
            if (!this.character.isColliding(coin)) return;
            if (this.character.isDead()) return;

            if (this.character.energy < 100) {
                // 체력이 부족하면 동전을 즉시 회복에 사용
                this.character.energy = Math.min(
                    100, this.character.energy + 10
                );
                this.statusBar.setPercentage(this.character.energy);
            } else if (this.collectedCoins < this.maxCoins) {
                // 체력이 가득 찼을 때만 동전 저장
                this.collectedCoins++;
                this.statusBarCoin.setPercentage(
                    (this.collectedCoins / this.maxCoins) * 100
                );
            } else {
                return;
            }

            this.level.coins.splice(idx, 1);
            playSound(AUDIO_HUB.coinCollect);
        });
    }

    draw() {
        if (this !== world || this.stopDrawing) return;

        if (!isPaused) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.translate(this.camera_x, 0);
            this.drawWorldObjects();
            this.ctx.translate(-this.camera_x, 0);
            this.drawStatusBars();
            this.ctx.translate(this.camera_x, 0);
            this.addToMap(this.character);
            this.ctx.translate(-this.camera_x, 0);
        }

        requestAnimationFrame(() => this.draw());
    }

    drawWorldObjects() {
        this.addObjectsToMap(this.level.backgroundObjects);
        this.addToMap(this.character);
        this.addObjectsToMap(this.level.clouds);
        if (this.level.bottles) this.addObjectsToMap(this.level.bottles);
        if (this.level.coins) this.addObjectsToMap(this.level.coins);
        this.addObjectsToMap(this.level.enemies);
        this.drawChickenHealthBars();
        this.addObjectsToMap(this.throwableObjects);
    }

    drawChickenHealthBars() {
        this.level.enemies.forEach(enemy => {
            if (!(enemy instanceof Chicken) || enemy.isDead()) return;

            let barWidth = 50;
            let barHeight = 6;
            let x = enemy.x + (enemy.width - barWidth) / 2;
            let y = enemy.y - 12;
            let percentage = enemy.energy / enemy.maxEnergy;

            this.ctx.fillStyle = '#555555';
            this.ctx.fillRect(x, y, barWidth, barHeight);

            if (percentage > 0.6) this.ctx.fillStyle = '#22c55e';
            else if (percentage > 0.3) this.ctx.fillStyle = '#eab308';
            else this.ctx.fillStyle = '#ef4444';

            this.ctx.fillRect(x, y, barWidth * percentage, barHeight);
        });
    }

    drawStatusBars() {
        this.addToMap(this.statusBar);
        this.drawBottleCounter();
        this.drawCoinCounter();

        let endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (endboss && endboss.hadFirstContact) {
            this.addToMap(this.statusBarEndboss);
        }
    }

    drawBottleCounter() {
        if (this.bottleIcon.complete && this.bottleIcon.naturalWidth > 0) {
            this.ctx.drawImage(this.bottleIcon, 12, 86, 60, 60);
        }
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('× ' + this.availableBottles, 60, 122);
    }

    drawCoinCounter() {
        if (this.coinIcon.complete && this.coinIcon.naturalWidth > 0) {
            this.ctx.drawImage(this.coinIcon, 18, 55, 52, 52);
        }
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('× ' + this.collectedCoins, 60, 87);
    }

    addObjectsToMap(objects) {
        if (objects) objects.forEach(o => this.addToMap(o));
    }

    addToMap(mo) {
        if (mo.otherDirection) this.flipImage(mo);
        mo.draw(this.ctx);
        if (mo.otherDirection) this.flipImageBack(mo);
    }

    flipImage(mo) {
        this.ctx.save();
        this.ctx.translate(mo.width, 0);
        this.ctx.scale(-1, 1);
        mo.x = mo.x * -1;
    }

    flipImageBack(mo) {
        mo.x = mo.x * -1;
        this.ctx.restore();
    }
}
