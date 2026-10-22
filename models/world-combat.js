
/** World collision and combat methods. */

World.prototype.checkCharacterCollisions = function () {
    this.level.enemies.forEach(enemy => {
        let isAlive = typeof enemy.isDead === 'function'
            ? !enemy.isDead() : !enemy.isDead;

        // Keep the previous collision-pass top. A stomp reaction changes a
        // chicken's hitbox briefly, independently of gravity's 40ms updates.
        enemy.previousCollisionTop = enemy.lastCollisionTop;
        enemy.lastCollisionTop = enemy.y + enemy.offset.top;

        if (isAlive && this.character.isColliding(enemy)) {
            this.handleEnemyContact(enemy);
        }
    });
};

World.prototype.handleEnemyContact = function (enemy) {
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
            let now = Date.now();

            // All levels: same 3-second stomp cooldown.
            if (now - (enemy.lastStompBounce || 0) < 3000) {
                return;
            }

            let attackMode = this.getBossAttackMode();

            // Levels 1, 2 and 4:
            // Respect the existing boss damage cooldown.
            if (attackMode !== 'bottle' &&
                now - enemy.lastHit < 3000) {
                return;
            }

            // A successful stomp always gives the same bounce.
            enemy.lastStompBounce = now;
            this.character.speedY = 15;

            // Levels 3 and 5: bounce without boss damage.
            if (attackMode === 'bottle') {
                return;
            }

            // Levels 1, 2 and 4: boss takes 20 damage.
            enemy.energy = Math.max(0, enemy.energy - 20);
            enemy.lastHit = now;

            this.statusBarEndboss.setPercentage(
                (enemy.energy / enemy.maxEnergy) * 100
            );

            // Stomping sounds remain centered.
            playSound(AUDIO_HUB.bossHurt);
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

    let recentFallSteps = this.character.lastFallSteps ||
        [this.character.lastFallStep].filter(Boolean);

    let collisionTops = [chickenTop, enemy.previousCollisionTop]
        .filter((top, index, tops) =>
            Number.isFinite(top) && tops.indexOf(top) === index
        );

    let crossedChickenTop = recentFallSteps.some(lastStep =>
        Date.now() - lastStep.time < 120 &&
        collisionTops.some(top =>
            lastStep.from <= top && lastStep.to >= top
        ) &&
        lastStep.right > chickenLeft && lastStep.left < chickenRight
    );

    let landsOnTop = crossedChickenTop &&
        pepeRight > chickenLeft &&
        pepeLeft < chickenRight;

    if (landsOnTop) {
        if (this.stompEnemy(enemy)) {
            this.character.lastFallStep = null;
            this.character.lastFallSteps = [];
            // Gravity updates every 40 ms but contacts are checked every
            // 50 ms. Pepe can still overlap this (or a neighboring) chicken
            // while the automatic stomp bounce has already started.
            this.character.stompBounceUntil = Date.now() + 200;
        }
    } else if (Date.now() >= (this.character.stompBounceUntil || 0)) {
        this.hurtCharacter();
    }
};

World.prototype.hurtCharacter = function (damage = 40) {
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

World.prototype.stompEnemy = function (enemy) {
    if (!(enemy instanceof Chicken)) return false;

    let now = Date.now();
    if (now - enemy.lastStomp < enemy.stompCooldown) return false;

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

    return true;
};

World.prototype.removeEnemyAfterDelay = function (enemy, delay) {
    let currentLevel = this.level;

    setTimeout(() => {
        if (this !== world || this.level !== currentLevel) return;
        let idx = currentLevel.enemies.indexOf(enemy);
        if (idx > -1) currentLevel.enemies.splice(idx, 1);
    }, delay);
};

World.prototype.checkBottleCollisions = function () {
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

World.prototype.handleBottleImpact = function (bottle, enemy) {
    if (enemy instanceof Endboss) {
        enemy.hadFirstContact = true;

        if (this.getBossAttackMode() === 'stomp') return;

        if (enemy.isHitOnHead(bottle) &&
            Date.now() - enemy.lastHit >= 3000) {
            enemy.hit();
            playSpatialSound(AUDIO_HUB.bossHurt, enemy.x + enemy.width / 2);

            this.statusBarEndboss.setPercentage(
                (enemy.energy / enemy.maxEnergy) * 100
            );
        }
    } else if (enemy instanceof SmallChicken) {
        playSpatialSound(AUDIO_HUB.smallChickenDead, enemy.x + enemy.width / 2);

        if (typeof enemy.die === 'function') enemy.die();
        this.removeEnemyAfterDelay(enemy, 500);
    } else if (enemy instanceof Chicken) {
        // One bottle = two stomp attacks.
        enemy.energy = Math.max(0, enemy.energy - 2);

        if (enemy.energy === 0) {
            playSpatialSound(AUDIO_HUB.chickenDead, enemy.x + enemy.width / 2);
            enemy.die();
            this.removeEnemyAfterDelay(enemy, 500);
        } else {
            playSpatialSound(AUDIO_HUB.chickenStomp, enemy.x + enemy.width / 2);
            enemy.showStompReaction();
        }
    }
};

World.prototype.removeBottleAfterDelay = function (bottle, delay) {
    setTimeout(() => {
        if (this !== world) return;
        let idx = this.throwableObjects.indexOf(bottle);
        if (idx > -1) this.throwableObjects.splice(idx, 1);
    }, delay);
};
