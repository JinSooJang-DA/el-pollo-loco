/** Extends World with item collection and bottle throwing methods. */

/**
 * Validates whether Pepe is eligible to throw a salsa bottle.
 * @returns {boolean} True if a bottle can be thrown.
 */
World.prototype.canThrowBottle = function () {
    if (typeof hasReviveProtection === 'function' && hasReviveProtection(this.character)) return false;
    return Boolean(this.keyboard.D && this.canThrow && this.availableBottles > 0);
};

/**
 * Creates a bottle when the throw key, stock, and cooldown permit it.
 */
World.prototype.checkThrowObjects = function () {
    if (!this.canThrowBottle()) return;

    let bottle = this.createBottle();
    this.registerThrownBottle(bottle);
};

/**
 * Creates a bottle at Pepe's current position and facing direction.
 * @returns {ThrowableObject} The new bottle instance.
 */
World.prototype.createBottle = function () {
    let offset = this.character.otherDirection ? 0 : 60;

    return new ThrowableObject(
        this.character.x + offset,
        this.character.y + 140,
        this.character.otherDirection
    );
};

/**
 * Stores a thrown bottle and applies its stock, sound, HUD, and cooldown effects.
 * @param {ThrowableObject} bottle The thrown bottle instance.
 */
World.prototype.registerThrownBottle = function (bottle) {
    this.throwableObjects.push(bottle);
    this.availableBottles--;
    playSound(audioHub.throw);
    this.updateBottleBar();
    this.cooldownThrow();
};

/**
 * Updates the bottle status bar from the current bottle stock.
 */
World.prototype.updateBottleBar = function () {
    let percentage = (this.availableBottles / this.maxBottles) * 100;
    this.statusBarBottle.setPercentage(percentage);
};

/**
 * Starts the existing one-second bottle throwing cooldown.
 */
World.prototype.cooldownThrow = function () {
    this.canThrow = false;

    setTimeout(() => {
        if (this === world && !this.gameEnded) {
            this.canThrow = true;
        }
    }, 1000);
};

/**
 * Runs collision checks for enemies, bottles, and collectible items.
 */
World.prototype.checkCollisions = function () {
    this.checkCharacterCollisions();
    this.checkBottleCollisions();
    this.checkCollectBottles();
    this.checkCollectCoins();
};

/**
 * Collects a single bottle pickup and updates inventory and respawn timers.
 * @param {Bottle} bottle The collected bottle instance.
 * @param {number} idx The index of the bottle in the level array.
 */
World.prototype.collectSingleBottle = function (bottle, idx) {
    this.availableBottles++;
    this.level.bottles.splice(idx, 1);
    playSound(audioHub.bottleCollect);
    this.updateBottleBar();
    this.respawnBottle(bottle);
};

/**
 * Collects overlapping bottles until Pepe reaches the bottle limit.
 */
World.prototype.checkCollectBottles = function () {
    if (!this.level.bottles) return;

    for (let idx = this.level.bottles.length - 1; idx >= 0; idx--) {
        let bottle = this.level.bottles[idx];

        if (this.character.isColliding(bottle) && this.availableBottles < this.maxBottles) {
            this.collectSingleBottle(bottle, idx);
        }
    }
};

/**
 * Returns one collected bottle to the same level after its respawn delay.
 * @param {Bottle} bottle The bottle instance to respawn.
 */
World.prototype.respawnBottle = function (bottle) {
    let currentLevel = this.level;

    setTimeout(() => {
        if (this === world && !this.gameEnded && this.level === currentLevel) {
            currentLevel.bottles.push(bottle);
        }
    }, this.bottleRespawnTime);
};

/**
 * Processes the health or coin stash logic upon picking up a coin.
 * @param {Coin} coin The coin instance to process.
 * @returns {boolean} True if the coin was collected.
 */
World.prototype.applyCoinPickup = function (coin) {
    if (this.character.energy < 100) return this.applyCoinHealth();
    if (this.collectedCoins < this.maxCoins) return this.applyCoinStash();

    return false;
};

/**
 * Restores a small amount of health from a collected coin.
 * @returns {boolean} Always true because the coin is consumed.
 */
World.prototype.applyCoinHealth = function () {
    this.character.energy = Math.min(100, this.character.energy + 10);
    this.statusBar.setPercentage(this.character.energy);
    return true;
};

/**
 * Stores a collected coin toward the level coin maximum.
 * @returns {boolean} Always true because the coin is consumed.
 */
World.prototype.applyCoinStash = function () {
    this.collectedCoins++;
    this.statusBarCoin.setPercentage((this.collectedCoins / this.maxCoins) * 100);
    return true;
};

/**
 * Collects coins as health recovery or stored revive protection.
 */
World.prototype.checkCollectCoins = function () {
    if (!this.level.coins) return;

    for (let idx = this.level.coins.length - 1; idx >= 0; idx--) {
        this.collectCoinAt(idx);
    }
};

/**
 * Collects the coin at an index when Pepe touches it.
 * @param {number} idx The coin index inside the level array.
 */
World.prototype.collectCoinAt = function (idx) {
    let coin = this.level.coins[idx];

    if (!this.character.isColliding(coin) || this.character.isDead()) return;
    if (!this.applyCoinPickup(coin)) return;

    this.finishCoinCollection(idx, coin);
};

/**
 * Records and removes a collected coin and plays its sound.
 * @param {number} idx The coin index inside the level array.
 * @param {Coin} coin The collected coin instance.
 */
World.prototype.finishCoinCollection = function (idx, coin) {
    rememberCollectedCoin(this.levelNumber, coin);
    recordCollectedCoin();
    this.level.coins.splice(idx, 1);
    playSound(audioHub.coinCollect);
};