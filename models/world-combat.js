
/** World collision and combat methods. */

World.prototype.checkCharacterCollisions = function() {
    this.level.enemies.forEach(enemy => {
        let isAlive = typeof enemy.isDead === 'function'
            ? !enemy.isDead() : !enemy.isDead;

        if (isAlive && this.character.isColliding(enemy)) {
            this.handleEnemyContact(enemy);
        }
    });
};

World.prototype.handleEnemyContact = function(enemy) {
    if (enemy instanceof SmallChicken) {
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
            if (this.getBossAttackMode() === 'bottle') {
                this.character.speedY = 15;
                return;
            }

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

    // Normal chicken: only a downward landing counts as a stomp.
    let pepeFeet = this.character.y + this.character.height
        - this.character.offset.bottom;
    let chickenTop = enemy.y + enemy.offset.top;
    let pepeLeft = this.character.x + this.character.offset.left;
    let pepeRight = this.character.x + this.character.width
        - this.character.offset.right;
    let chickenLeft = enemy.x + enemy.offset.left;
    let chickenRight = enemy.x + enemy.width - enemy.offset.right;

    let landsOnTop = this.character.speedY < 0 &&
        pepeFeet >= chickenTop - 28 &&
        pepeFeet <= chickenTop + 22 &&
        pepeRight > chickenLeft &&
        pepeLeft < chickenRight;

    if (landsOnTop) this.stompEnemy(enemy);
    else this.hurtCharacter();
};

World.prototype.hurtCharacter = function(damage = 40) {
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
};

World.prototype.stompEnemy = function(enemy) {
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
};

World.prototype.removeEnemyAfterDelay = function(enemy, delay) {
    let currentLevel = this.level;

    setTimeout(() => {
        if (this !== world || this.level !== currentLevel) return;
        let idx = currentLevel.enemies.indexOf(enemy);
        if (idx > -1) currentLevel.enemies.splice(idx, 1);
    }, delay);
};

World.prototype.checkBottleCollisions = function() {
    this.throwableObjects.forEach(bottle => {
        if (bottle.isSplashed) return;

        // Determine all collisions before triggering splash.
        let hitEnemies = this.level.enemies.filter(enemy => {
            let alive = typeof enemy.isDead === 'function'
                ? !enemy.isDead() : !enemy.isDead;

            return alive && bottle.isColliding(enemy);
        });

        if (hitEnemies.length === 0) return;

        // One bottle can damage multiple overlapping enemies.
        hitEnemies.forEach(enemy => {
            this.handleBottleImpact(bottle, enemy);
        });

        bottle.splash();
        this.removeBottleAfterDelay(bottle, 100);
    });
};

World.prototype.handleBottleImpact = function(bottle, enemy) {
    if (enemy instanceof Endboss) {
        enemy.hadFirstContact = true;

        if (this.getBossAttackMode() === 'stomp') return;

        if (enemy.isHitOnHead(bottle) &&
            Date.now() - enemy.lastHit >= 3000) {
            enemy.hit();
            playSound(AUDIO_HUB.bossHurt);

            this.statusBarEndboss.setPercentage(
                (enemy.energy / enemy.maxEnergy) * 100
            );
        }
    } else if (enemy instanceof SmallChicken) {
        playSound(AUDIO_HUB.smallChickenDead);

        if (typeof enemy.die === 'function') enemy.die();
        this.removeEnemyAfterDelay(enemy, 500);
    } else if (enemy instanceof Chicken) {
        // One bottle = two stomp attacks.
        enemy.energy = Math.max(0, enemy.energy - 2);

        if (enemy.energy === 0) {
            playSound(AUDIO_HUB.chickenDead);
            enemy.die();
            this.removeEnemyAfterDelay(enemy, 500);
        } else {
            playSound(AUDIO_HUB.chickenStomp);
            enemy.showStompReaction();
        }
    }
};

World.prototype.removeBottleAfterDelay = function(bottle, delay) {
    setTimeout(() => {
        if (this !== world) return;
        let idx = this.throwableObjects.indexOf(bottle);
        if (idx > -1) this.throwableObjects.splice(idx, 1);
    }, delay);
};
