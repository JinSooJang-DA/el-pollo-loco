
/** World rendering methods. */

World.prototype.draw = function() {
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

World.prototype.drawWorldObjects = function() {
    this.addObjectsToMap(this.level.backgroundObjects);
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.clouds);

    if (this.level.bottles) {
        this.addObjectsToMap(this.level.bottles);
    }

    if (this.level.coins) {
        this.addObjectsToMap(this.level.coins);
    }

    this.addObjectsToMap(this.level.enemies);
    this.drawChickenHealthBars();
    this.addObjectsToMap(this.throwableObjects);
};

World.prototype.drawChickenHealthBars = function() {
    this.level.enemies.forEach(enemy => {
        if (!(enemy instanceof Chicken) || enemy.isDead()) return;

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
};

World.prototype.drawStatusBars = function() {
    this.addToMap(this.statusBar);
    this.drawBottleCounter();
    this.drawCoinCounter();

    let endboss = this.level.enemies.find(e => e instanceof Endboss);

    if (endboss && endboss.hadFirstContact) {
        this.addToMap(this.statusBarEndboss);
    }
};

World.prototype.drawBottleCounter = function() {
    if (this.bottleIcon.complete && this.bottleIcon.naturalWidth > 0) {
        this.ctx.drawImage(this.bottleIcon, 12, 86, 60, 60);
    }

    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('× ' + this.availableBottles, 60, 122);
};

World.prototype.drawCoinCounter = function() {
    if (this.coinIcon.complete && this.coinIcon.naturalWidth > 0) {
        this.ctx.drawImage(this.coinIcon, 18, 55, 52, 52);
    }

    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('× ' + this.collectedCoins, 60, 87);
};

World.prototype.addObjectsToMap = function(objects) {
    if (objects) objects.forEach(o => this.addToMap(o));
};

World.prototype.addToMap = function(mo) {
    if (mo.otherDirection) this.flipImage(mo);
    mo.draw(this.ctx);
    if (mo.otherDirection) this.flipImageBack(mo);
};

World.prototype.flipImage = function(mo) {
    this.ctx.save();
    this.ctx.translate(mo.width, 0);
    this.ctx.scale(-1, 1);
    mo.x = mo.x * -1;
};

World.prototype.flipImageBack = function(mo) {
    mo.x = mo.x * -1;
    this.ctx.restore();
};
