/**
 * Extends World with rendering methods.
 */

/**
 * Clears and renders active world layers, UI status bars, and the character.
 */
World.prototype.renderActiveWorld = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.translate(this.camera_x, 0);
    this.drawWorldObjects();
    this.ctx.translate(-this.camera_x, 0);

    this.drawStatusBars();

    this.ctx.translate(this.camera_x, 0);
    this.addToMap(this.character);
    this.ctx.translate(-this.camera_x, 0);
};

/**
 * Draws one animation frame while this World instance is active and unpaused.
 */
World.prototype.draw = function () {
    if (this !== world || this.stopDrawing) return;

    if (!isPaused) {
        this.renderActiveWorld();
    }

    requestAnimationFrame(() => this.draw());
};

/**
 * Draws collectibles, enemies, health bars, and active throwable bottles.
 */
World.prototype.drawWorldCollectiblesAndActors = function () {
    if (this.level.bottles) this.addObjectsToMap(this.level.bottles);
    if (this.level.coins) this.addObjectsToMap(this.level.coins);
    this.addObjectsToMap(this.level.enemies);
    this.drawChickenHealthBars();
    this.addObjectsToMap(this.throwableObjects);
};

/**
 * Draws map objects in their intended background-to-foreground order.
 */
World.prototype.drawWorldObjects = function () {
    this.drawBackgroundObjects();
    this.addObjectsToMap(this.level.clouds);
    this.drawWorldCollectiblesAndActors();
};

/**
 * Draws background tiles on whole pixels to prevent seams during camera movement.
 */
World.prototype.drawBackgroundObjects = function () {
    let pixelCorrection = Math.round(this.camera_x) - this.camera_x;

    this.ctx.save();
    this.ctx.translate(pixelCorrection, 0);
    this.addObjectsToMap(this.level.backgroundObjects);
    this.ctx.restore();
};

/**
 * Returns the matching color string for a chicken health bar percentage.
 * @param {number} percentage The remaining health percentage (0 to 1).
 * @returns {string} The color hex string.
 */
World.prototype.getHealthBarColor = function (percentage) {
    if (percentage > 0.6) return '#22c55e';
    if (percentage > 0.3) return '#eab308';
    return '#ef4444';
};

/**
 * Renders the health bar graphical indicator above a specific normal chicken.
 * @param {Chicken} enemy The normal chicken instance.
 */
World.prototype.renderChickenHealthBar = function (enemy) {
    let barWidth = 50;
    let barHeight = 6;
    let x = enemy.x + (enemy.width - barWidth) / 2;
    let y = enemy.y - 12;
    let percentage = enemy.energy / enemy.maxEnergy;

    this.ctx.fillStyle = '#555555';
    this.ctx.fillRect(x, y, barWidth, barHeight);

    this.ctx.fillStyle = this.getHealthBarColor(percentage);
    this.ctx.fillRect(x, y, barWidth * percentage, barHeight);
};

/**
 * Draws health bars above living normal chickens that need more than one hit.
 * Level 1 chickens die with one stomp, so they show no bar.
 */
World.prototype.drawChickenHealthBars = function () {
    this.level.enemies.forEach(enemy => {
        if (!(enemy instanceof Chicken) || enemy.isDead()) return;
        if (enemy.maxEnergy <= 1) return;
        this.renderChickenHealthBar(enemy);
    });
};

/**
 * Draws Pepe's HUD status bars and the boss health bar after engagement.
 */
World.prototype.drawStatusBars = function () {
    this.addToMap(this.statusBar);
    this.drawBottleCounter();
    this.drawCoinCounter();

    let endboss = this.level.enemies.find(e => e instanceof Endboss);

    if (endboss && endboss.hadFirstContact) {
        this.addToMap(this.statusBarEndboss);
    }
};

/**
 * Draws the available bottle icon and quantity text onto the HUD.
 */
World.prototype.drawBottleCounter = function () {
    if (this.bottleIcon.complete && this.bottleIcon.naturalWidth > 0) {
        this.ctx.drawImage(this.bottleIcon, 18, 100, 28, 40);
    }

    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('× ' + this.availableBottles, 60, 122);
};

/**
 * Draws the collected coin icon and quantity text onto the HUD.
 */
World.prototype.drawCoinCounter = function () {
    if (this.coinIcon.complete && this.coinIcon.naturalWidth > 0) {
        this.ctx.drawImage(this.coinIcon, 18, 65, 30, 30);
    }

    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('× ' + this.collectedCoins, 60, 87);
};

/**
 * Draws every object in a given array onto the canvas.
 * @param {MovableObject[]} objects Array of drawable objects.
 */
World.prototype.addObjectsToMap = function (objects) {
    if (objects) objects.forEach(o => this.addToMap(o));
};

/**
 * Renders the character with a blinking transparency effect while revive protection is active.
 * @param {Character} mo The character instance with revive protection.
 */
World.prototype.drawWithReviveProtection = function (mo) {
    this.ctx.save();
    this.ctx.globalAlpha = Math.floor(Date.now() / 180) % 2 ? 0.42 : 1;
    if (mo.otherDirection) this.flipImage(mo);
    mo.draw(this.ctx);
    if (mo.otherDirection) this.flipImageBack(mo);
    this.ctx.restore();
};

/**
 * Draws one movable object, applying a directional flip when required.
 * @param {MovableObject} mo The movable object instance to render.
 */
World.prototype.addToMap = function (mo) {
    if (mo === this.character && typeof hasReviveProtection === 'function' &&
        hasReviveProtection(mo)) {
        return this.drawWithReviveProtection(mo);
    }

    if (mo.otherDirection) this.flipImage(mo);
    mo.draw(this.ctx);
    if (mo.otherDirection) this.flipImageBack(mo);
};

/**
 * Mirrors the canvas horizontally for one left-facing object.
 * @param {MovableObject} mo The movable object instance to flip.
 */
World.prototype.flipImage = function (mo) {
    this.ctx.save();
    this.ctx.translate(mo.width, 0);
    this.ctx.scale(-1, 1);
    mo.x = mo.x * -1;
};

/**
 * Restores the canvas transform matrix after drawing a flipped object.
 * @param {MovableObject} mo The movable object instance to restore.
 */
World.prototype.flipImageBack = function (mo) {
    mo.x = mo.x * -1;
    this.ctx.restore();
};