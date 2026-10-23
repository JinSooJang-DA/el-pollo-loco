
/** World item collection and throwing methods. */

World.prototype.checkThrowObjects = function () {
    if (typeof hasReviveProtection === 'function' &&
        hasReviveProtection(this.character)) return;
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
};

World.prototype.updateBottleBar = function () {
    let percentage = (this.availableBottles / this.maxBottles) * 100;
    this.statusBarBottle.setPercentage(percentage);
};

World.prototype.cooldownThrow = function () {
    this.canThrow = false;

    setTimeout(() => {
        if (this === world && !this.gameEnded) {
            this.canThrow = true;
        }
    }, 1000);
};

World.prototype.checkCollisions = function () {
    this.checkCharacterCollisions();
    this.checkBottleCollisions();
    this.checkCollectBottles();
    this.checkCollectCoins();
};

World.prototype.checkCollectBottles = function () {
    if (!this.level.bottles) return;

    for (let idx = this.level.bottles.length - 1; idx >= 0; idx--) {
        let bottle = this.level.bottles[idx];

        if (this.character.isColliding(bottle) &&
            this.availableBottles < this.maxBottles) {
            this.availableBottles++;
            this.level.bottles.splice(idx, 1);
            playSound(AUDIO_HUB.bottleCollect);
            this.updateBottleBar();
            this.respawnBottle(bottle);
        }
    }
};

World.prototype.respawnBottle = function (bottle) {
    let currentLevel = this.level;

    setTimeout(() => {
        if (this === world && !this.gameEnded &&
            this.level === currentLevel) {
            currentLevel.bottles.push(bottle);
        }
    }, this.bottleRespawnTime);
};

World.prototype.checkCollectCoins = function () {
    if (!this.level.coins) return;

    for (let idx = this.level.coins.length - 1; idx >= 0; idx--) {
        let coin = this.level.coins[idx];

        if (!this.character.isColliding(coin)) continue;
        if (this.character.isDead()) continue;

        if (this.character.energy < 100) {
            // A coin restores 10 HP and is consumed immediately.
            this.character.energy = Math.min(
                100, this.character.energy + 10
            );

            this.statusBar.setPercentage(this.character.energy);
        } else if (this.collectedCoins < this.maxCoins) {
            // Store coins for protection only when HP is full.
            this.collectedCoins++;

            this.statusBarCoin.setPercentage(
                (this.collectedCoins / this.maxCoins) * 100
            );
        } else {
            continue;
        }

        rememberCollectedCoin(this.levelNumber, coin);
        recordCollectedCoin();
        this.level.coins.splice(idx, 1);
        playSound(AUDIO_HUB.coinCollect);
    }
};
