/**
 * Represents the game world managing rendering loops, collisions, and state.
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
    canThrow = true;
    availableBottles = 0;
    bottleRespawnTime = 10000;
    maxBottles = 5;
    collectedCoins = 0;
    maxCoins = 5;
    bossSpawned = false;
    gameEnded = false;
    stopDrawing = false;

    /**
     * Initializes the world canvas context, level references, and loops.
     * @param {HTMLCanvasElement} canvas - Target rendering canvas.
     * @param {Keyboard} keyboard - Input state tracker.
     */
    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.level = level1;
        this.bottleIcon = new Image();
        this.bottleIcon.src = 'img/6_salsa_bottle/salsa_bottle.png';
        this.coinIcon = new Image();
        this.coinIcon.src = 'img/8_coin/coin_1.png';
        this.setWorld();
        this.draw();
        this.run();
    }

    /**
     * Injects the world instance into the character.
     */
    setWorld() {
        this.character.world = this;
    }

    /**
     * Runs collision, projectile, and game over detection loops.
     */
    run() {
        setInterval(() => {
            if (isPaused) return;
            this.checkCollisions();
            this.checkBossSpawn();
            this.checkThrowObjects();
            this.checkGameOver();
            this.checkBossMusicTrigger();
        }, 50);
    }

    /**
     * Triggers boss BGM (bgm03) when encountering the endboss.
     */
    checkBossMusicTrigger() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (endboss && endboss.hadFirstContact && currentBgm !== AUDIO_HUB.bgmBoss && !this.gameEnded) {
            playBgm(AUDIO_HUB.bgmBoss);
        }
    }


    checkBossSpawn() {
        if (this.bossSpawned || this.gameEnded) return;

        let remainingEnemies = this.level.enemies.filter(
            enemy => !enemy.isDead()
        );

        if (remainingEnemies.length === 0) {
            this.bossSpawned = true;

            let boss = new Endboss();
            let distance = 500;

            if (this.character.otherDirection) {
                boss.x = this.character.x - distance;
            } else {
                boss.x = this.character.x + distance;
            }

            boss.x = Math.max(0, Math.min(boss.x, this.level.level_end_x - boss.width));

            this.level.enemies.push(boss);
        }
    }


    /**
     * Verifies victory and defeat conditions.
     */
    checkGameOver() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (this.character.isDead() && !this.gameEnded) {
            this.gameEnded = true;
            playSound(AUDIO_HUB.pepeDead);
            playBgm(AUDIO_HUB.bgmLost);
            // 사망 애니메이션이 충분히 보이도록 1.5초(1500ms) 뒤에 패배 화면 표시
            setTimeout(() => this.showEndScreen('img/You won, you lost/You lost.png'), 1500);
        }
        if (endboss && endboss.deathAnimationFinished && !this.gameEnded) {
            this.gameEnded = true;
            stopSoundEffects();
            playBgm(AUDIO_HUB.bgmWin);
            this.showEndScreen('img/You won, you lost/You win B.png');
        }
    }

    /**
     * Clears game timers and reveals the end screen.
     * @param {string} imagePath - Result image path to display.
     */
    showEndScreen(imagePath) {
        this.stopDrawing = true; // 2. 결과 화면이 뜰 때 비로소 캔버스 그리기 중단!
        for (let i = 1; i < 9999; i++) window.clearInterval(i);
        let endScreenImg = document.getElementById('endScreenImg');
        let restartScreen = document.getElementById('restartScreen');
        this.setEndScreenImage(endScreenImg, imagePath);
        if (restartScreen) {
            restartScreen.classList.remove('d-none');
        }
    }

    /**
     * Sets result screen image source and provides fallback handling.
     * @param {HTMLImageElement} imgElement - Image DOM element.
     * @param {string} imagePath - Primary image path.
     */
    setEndScreenImage(imgElement, imagePath) {
        if (!imgElement) return;
        imgElement.src = imagePath;
        imgElement.onload = () => imgElement.classList.remove('d-none');
        imgElement.onerror = () => {
            imgElement.src = 'img/9_intro_outro_screens/game_over/game over.png';
            imgElement.classList.remove('d-none');
        };
    }

    /**
     * Triggers bottle throwing if user input is active and ammo is available.
     */
    checkThrowObjects() {
        if (this.keyboard.D && this.canThrow && this.availableBottles > 0) {
            let offset = this.character.otherDirection ? 0 : 60;
            let bottle = new ThrowableObject(this.character.x + offset, this.character.y + 140, this.character.otherDirection);
            this.throwableObjects.push(bottle);
            this.availableBottles--;
            playSound(AUDIO_HUB.throw); // 실제로 병을 던질 때만 소리 재생!
            this.updateBottleBar();
            this.cooldownThrow();
        }
    }

    /**
     * Updates bottle status bar based on remaining quantity.
     */
    updateBottleBar() {
        let percentage = (this.availableBottles / this.maxBottles) * 100;
        this.statusBarBottle.setPercentage(percentage);
    }

    /**
     * Applies cooldown delay to bottle throwing.
     */
    cooldownThrow() {
        this.canThrow = false;
        setTimeout(() => this.canThrow = true, 1000);
    }

    /**
     * Orchestrates all collision sub-checks.
     */
    checkCollisions() {
        this.checkCharacterCollisions();
        this.checkBottleCollisions();
        this.checkCollectBottles();
        this.checkCollectCoins();
    }

    /**
     * Checks collision between hero Pepe and all active enemies.
     */
    checkCharacterCollisions() {
        this.level.enemies.forEach((enemy) => {
            let isAlive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;
            if (isAlive && this.character.isColliding(enemy)) {
                this.handleEnemyContact(enemy);
            }
        });
    }

    /**
     * Resolves stomp versus hurt outcome during enemy collision.
     * @param {MovableObject} enemy - Colliding enemy object.
     */
    handleEnemyContact(enemy) {
        if (enemy instanceof SmallChicken) {
            if (!this.character.isHurt() && !this.character.isDead()) {
                playSound(AUDIO_HUB.smallChickenDead);
            }
            this.hurtCharacter();
            return;
        }
        if (enemy instanceof Endboss) {
            if (Date.now() - enemy.lastHit < 2000) return;
            this.hurtCharacter(40);
        } else if (this.character.speedY < 0 || this.character.isAboveGround()) {
            this.stompEnemy(enemy);
        } else {
            this.hurtCharacter();
        }
    }

    /**
     * Inflicts damage onto Pepe, plays hurt sound, and updates health bar.
     */

    hurtCharacter(damage = 20) {
        if (!this.character.isHurt() && !this.character.isDead()) {
            if (this.collectedCoins > 0) {
                this.collectedCoins--;
                let percentage = (this.collectedCoins / this.maxCoins) * 100;
                this.statusBarCoin.setPercentage(percentage);
                this.character.lastHit = Date.now();
            } else {
                this.character.energy = Math.max(0, this.character.energy - damage);
                this.character.lastHit = Date.now();
                this.statusBar.setPercentage(this.character.energy);
            }

            playSound(AUDIO_HUB.pepeHurt);
        }
    }


    /**
     * Eliminates regular enemies jumped on from above and plays appropriate sound.
     * @param {Chicken|SmallChicken} enemy - Target enemy to stomp.
     */
    stompEnemy(enemy) {
        if (!(enemy instanceof Chicken)) return;

        let now = Date.now();

        if (now - enemy.lastStomp < enemy.stompCooldown) {
            return;
        }

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

    /**
     * Removes an enemy from level array after animation delay.
     * @param {MovableObject} enemy - Target enemy object.
     * @param {number} delay - Removal delay in milliseconds.
     */
    removeEnemyAfterDelay(enemy, delay) {
        setTimeout(() => {
            let idx = this.level.enemies.indexOf(enemy);
            if (idx > -1) this.level.enemies.splice(idx, 1);
        }, delay);
    }

    /**
     * Checks projectile bottle collision with enemies.
     */
    checkBottleCollisions() {
        this.throwableObjects.forEach((bottle) => {
            this.level.enemies.forEach((enemy) => {
                let isAlive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;
                if (isAlive && !bottle.isSplashed && bottle.isColliding(enemy)) {
                    this.handleBottleImpact(bottle, enemy);
                }
            });
        });
    }

    /**
     * Handles bottle splash animation, sound, and damage on impact.
     * @param {ThrowableObject} bottle - Thrown projectile.
     * @param {MovableObject} enemy - Impact target.
     */
    handleBottleImpact(bottle, enemy) {
        bottle.isSplashed = true;
        if (typeof bottle.splash === 'function') bottle.splash();
        if (enemy instanceof Endboss) {
            enemy.hadFirstContact = true;

            if (enemy.isHitOnHead(bottle)) {
                if (Date.now() - enemy.lastHit >= 3000) {
                    enemy.hit();
                    playSound(AUDIO_HUB.bossHurt);
                    this.statusBarEndboss.setPercentage(enemy.energy);
                }
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

    /**
     * Removes thrown bottle from the map array after splash completion.
     * @param {ThrowableObject} bottle - Bottle instance to remove.
     * @param {number} delay - Removal delay in milliseconds.
     */
    removeBottleAfterDelay(bottle, delay) {
        setTimeout(() => {
            let idx = this.throwableObjects.indexOf(bottle);
            if (idx > -1) this.throwableObjects.splice(idx, 1);
        }, delay);
    }

    /**
     * Checks pickup collisions with ground bottles and plays sound.
     */
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
        setTimeout(() => {
            if (!this.gameEnded) {
                this.level.bottles.push(bottle);
            }
        }, this.bottleRespawnTime);
    }

    /**
     * Checks pickup collisions with coins and plays sound.
     */
    checkCollectCoins() {
        if (!this.level.coins) return;

        this.level.coins.forEach((coin, idx) => {
            if (this.character.isColliding(coin)) {
                this.collectedCoins++;
                this.level.coins.splice(idx, 1);
                playSound(AUDIO_HUB.coinCollect);

                let percentage = (this.collectedCoins / this.maxCoins) * 100;
                this.statusBarCoin.setPercentage(percentage);
            }
        });
    }

    /**
     * Main canvas rendering animation loop.
     */
    draw() {
        if (this.stopDrawing) return;
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

    /**
     * Draws moving world objects with camera translation applied.
     */
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
            if (!(enemy instanceof Chicken) || enemy.isDead()) {
                return;
            }

            let barWidth = 50;
            let barHeight = 6;
            let x = enemy.x + (enemy.width - barWidth) / 2;
            let y = enemy.y - 12;

            let percentage = enemy.energy / enemy.maxEnergy;

            this.ctx.fillStyle = '#555555';
            this.ctx.fillRect(x, y, barWidth, barHeight);

            if (percentage > 0.6) {
                this.ctx.fillStyle = '#22c55e';
            } else if (percentage > 0.3) {
                this.ctx.fillStyle = '#eab308';
            } else {
                this.ctx.fillStyle = '#ef4444';
            }

            this.ctx.fillRect(x, y, barWidth * percentage, barHeight);
        });
    }

    /**
     * Draws static UI status bars on top of canvas.
     */
    drawStatusBars() {
        this.addToMap(this.statusBar);
        // this.addToMap(this.statusBarBottle);
        this.drawBottleCounter();
        // this.addToMap(this.statusBarCoin);
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

    /**
     * Adds an array of objects to map.
     * @param {DrawableObject[]} objects - List of drawable objects.
     */
    addObjectsToMap(objects) {
        if (objects) {
            objects.forEach(o => this.addToMap(o));
        }
    }

    /**
     * Renders a drawable object with directional flipping if required.
     * @param {MovableObject} mo - Movable object instance.
     */
    addToMap(mo) {
        if (mo.otherDirection) this.flipImage(mo);
        mo.draw(this.ctx);
        if (mo.otherDirection) this.flipImageBack(mo);
    }

    /**
     * Flips canvas context horizontally for mirror-facing rendering.
     * @param {MovableObject} mo - Movable object instance.
     */
    flipImage(mo) {
        this.ctx.save();
        this.ctx.translate(mo.width, 0);
        this.ctx.scale(-1, 1);
        mo.x = mo.x * -1;
    }

    /**
     * Restores canvas transformation back to normal orientation.
     * @param {MovableObject} mo - Movable object instance.
     */
    flipImageBack(mo) {
        mo.x = mo.x * -1;
        this.ctx.restore();
    }
}