/** World rendering methods. */

/** Draws one animation frame while this World instance is active. */
World.prototype.draw = function () {
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
};

/** Draws collectibles and actors in the level. */
World.prototype.drawWorldCollectiblesAndActors = function () {
    if (this.level.bottles) this.addObjectsToMap(this.level.bottles);
    if (this.level.coins) this.addObjectsToMap(this.level.coins);
    this.addObjectsToMap(this.level.enemies);
    this.drawChickenHealthBars();
    this.addObjectsToMap(this.throwableObjects);
};

/** Draws map objects in their intended background-to-foreground order. */
World.prototype.drawWorldObjects = function () {
    this.drawBackgroundObjects();
    this.addObjectsToMap(this.level.clouds);
    this.drawWorldCollectiblesAndActors();
};

/** Draws background tiles on whole pixels to prevent seams during camera movement. */
World.prototype.drawBackgroundObjects = function () {
    let pixelCorrection = Math.round(this.camera_x) - this.camera_x;

    this.ctx.save();
    this.ctx.translate(pixelCorrection, 0);
    this.addObjectsToMap(this.level.backgroundObjects);
    this.ctx.restore();
};

/** Returns the correct color for the chicken health bar. */
World.prototype.getHealthBarColor = function (percentage) {
    if (percentage > 0.6) return '#22c55e';
    if (percentage > 0.3) return '#eab308';
    return '#ef4444';
};

/** Renders the actual health bar graphic for a chicken. */
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

/** Draws health bars above living normal chickens. */
World.prototype.drawChickenHealthBars = function () {
    this.level.enemies.forEach(enemy => {
        if (!(enemy instanceof Chicken) || enemy.isDead()) return;
        this.renderChickenHealthBar(enemy);
    });
};

/** Draws Pepe's status bars and the active boss health bar. */
World.prototype.drawStatusBars = function () {
    this.addToMap(this.statusBar);
    this.drawBottleCounter();
    this.drawCoinCounter();

    let endboss = this.level.enemies.find(e => e instanceof Endboss);

    if (endboss && endboss.hadFirstContact) {
        this.addToMap(this.statusBarEndboss);
    }
};

/** Draws the available bottle icon and count. */
World.prototype.drawBottleCounter = function () {
    if (this.bottleIcon.complete && this.bottleIcon.naturalWidth > 0) {
        this.ctx.drawImage(this.bottleIcon, 18, 100, 28, 40);
    }

    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('× ' + this.availableBottles, 60, 122);
};

/** Draws the stored coin icon and count. */
World.prototype.drawCoinCounter = function () {
    if (this.coinIcon.complete && this.coinIcon.naturalWidth > 0) {
        this.ctx.drawImage(this.coinIcon, 18, 65, 30, 30);
    }

    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('× ' + this.collectedCoins, 60, 87);
};

/** Draws every object in an array when the array exists. */
World.prototype.addObjectsToMap = function (objects) {
    if (objects) objects.forEach(o => this.addToMap(o));
};

/** Draws one movable object, including its directional flip when required. */
World.prototype.addToMap = function (mo) {
    if (mo === this.character && typeof hasReviveProtection === 'function' &&
        hasReviveProtection(mo)) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.floor(Date.now() / 180) % 2 ? 0.42 : 1;
        if (mo.otherDirection) this.flipImage(mo);
        mo.draw(this.ctx);
        if (mo.otherDirection) this.flipImageBack(mo);
        this.ctx.restore();
        return;
    }
    
    if (mo.otherDirection) this.flipImage(mo);
    mo.draw(this.ctx);
    if (mo.otherDirection) this.flipImageBack(mo);
};

/** Mirrors the canvas for one left-facing object. */
World.prototype.flipImage = function (mo) {
    this.ctx.save();
    this.ctx.translate(mo.width, 0);
    this.ctx.scale(-1, 1);
    mo.x = mo.x * -1;
};

/** Restores the canvas after drawing one left-facing object. */
World.prototype.flipImageBack = function (mo) {
    mo.x = mo.x * -1;
    this.ctx.restore();
};