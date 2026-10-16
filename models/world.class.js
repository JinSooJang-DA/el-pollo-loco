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
    maxBottles = 5;
    collectedCoins = 0;
    maxCoins = 5;
    gameEnded = false;

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
            this.checkCollisions();
            this.checkThrowObjects();
            this.checkGameOver();
        }, 50);
    }

    /**
     * Verifies victory and defeat conditions.
     */
    checkGameOver() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (this.character.isDead() && !this.gameEnded) {
            this.gameEnded = true;
            setTimeout(() => this.showEndScreen('img/You won, you lost/You lost.png'), 1000);
        }
        if (endboss && endboss.deathAnimationFinished && !this.gameEnded) {
            this.gameEnded = true;
            this.showEndScreen('img/You won, you lost/You win B.png');
        }
    }

    /**
     * Clears game timers and reveals the end screen.
     * @param {string} imagePath - Result image path to display.
     */
    showEndScreen(imagePath) {
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
        if (enemy instanceof Endboss) {
            this.hurtCharacter();
        } else if (this.character.speedY < 0 || this.character.isAboveGround()) {
            this.stompEnemy(enemy);
        } else {
            this.hurtCharacter();
        }
    }

    /**
     * Inflicts damage onto Pepe and updates the health status bar.
     */
    hurtCharacter() {
        if (!this.character.isHurt()) {
            this.character.hit();
            this.statusBar.setPercentage(this.character.energy);
        }
    }

    /**
     * Eliminates regular enemies jumped on from above and bounces character upward.
     * @param {Chicken|SmallChicken} enemy - Target enemy to stomp.
     */
    stompEnemy(enemy) {
        if (typeof enemy.die === 'function') enemy.die();
        this.character.speedY = 15;
        this.removeEnemyAfterDelay(enemy, 500);
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
     * Handles bottle splash animation and damage on impact.
     * @param {ThrowableObject} bottle - Thrown projectile.
     * @param {MovableObject} enemy - Impact target.
     */
    handleBottleImpact(bottle, enemy) {
        bottle.isSplashed = true;
        if (typeof bottle.splash === 'function') bottle.splash();
        if (enemy instanceof Endboss) {
            enemy.hadFirstContact = true;
            enemy.hit();
            this.statusBarEndboss.setPercentage(enemy.energy);
        } else {
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
     * Checks pickup collisions with ground bottles.
     */
    checkCollectBottles() {
        if (!this.level.bottles) return;
        this.level.bottles.forEach((bottle, idx) => {
            if (this.character.isColliding(bottle) && this.availableBottles < this.maxBottles) {
                this.availableBottles++;
                this.level.bottles.splice(idx, 1);
                this.updateBottleBar();
            }
        });
    }

    /**
     * Checks pickup collisions with coins.
     */
    checkCollectCoins() {
        if (!this.level.coins) return;
        this.level.coins.forEach((coin, idx) => {
            if (this.character.isColliding(coin)) {
                this.collectedCoins++;
                this.level.coins.splice(idx, 1);
                let percentage = (this.collectedCoins / this.maxCoins) * 100;
                this.statusBarCoin.setPercentage(percentage);
            }
        });
    }

    /**
     * Main canvas rendering animation loop.
     */
    draw() {
        if (this.gameEnded) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(this.camera_x, 0);
        this.drawWorldObjects();
        this.ctx.translate(-this.camera_x, 0);
        this.drawStatusBars();
        let self = this;
        requestAnimationFrame(() => self.draw());
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
        this.addObjectsToMap(this.throwableObjects);
    }

    /**
     * Draws static UI status bars on top of canvas.
     */
    drawStatusBars() {
        this.addToMap(this.statusBar);
        this.addToMap(this.statusBarBottle);
        this.addToMap(this.statusBarCoin);
        let endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (endboss && endboss.hadFirstContact) {
            this.addToMap(this.statusBarEndboss);
        }
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