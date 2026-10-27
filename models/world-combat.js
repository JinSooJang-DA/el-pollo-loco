/** World collision and combat methods. */

/** Checks Pepe's collision with every living enemy in the current level. */
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

/** Routes an enemy collision to the matching damage or stomp handler. */
World.prototype.handleEnemyContact = function (enemy) {
    if (typeof hasReviveProtection === 'function' &&
        hasReviveProtection(this.character)) return;
        
    if (enemy instanceof SmallChicken) {
        return this.hurtCharacter();
    }

    if (enemy instanceof Endboss) {
        return this.handleBossContact(enemy);
    }

    this.handleChickenContact(enemy);
};

/** Checks if Pepe is currently stomping the boss. */
World.prototype.isBossStompCondition = function (enemy) {
    let pepeFeet = this.character.y + this.character.height - this.character.offset.bottom;
    let bossHead = enemy.y + enemy.height * 0.13;
    let bossHeadBottom = enemy.y + enemy.height * 0.43;
    let pepeLeft = this.character.x + this.character.offset.left;
    let pepeRight = this.character.x + this.character.width - this.character.offset.right;
    let headLeft = enemy.otherDirection ? enemy.x + enemy.width * 0.52 : enemy.x + enemy.width * 0.08;
    let headRight = headLeft + enemy.width * 0.38;
    
    return this.character.speedY < 0 && pepeFeet >= bossHead && pepeFeet <= bossHeadBottom &&
        pepeRight > headLeft && pepeLeft < headRight;
};

/** Executes the boss stomp effect and damage if applicable. */
World.prototype.executeBossStomp = function (enemy, now, attackMode) {
    enemy.lastStompBounce = now;
    this.character.speedY = 15;
    
    if (attackMode === 'bottle') return;
    
    enemy.energy = Math.max(0, enemy.energy - 20);
    enemy.lastHit = now;
    this.statusBarEndboss.setPercentage((enemy.energy / enemy.maxEnergy) * 100);
    playSound(AUDIO_HUB.bossHurt);
};

/** Applies boss stomp rules or damages Pepe after boss contact. */
World.prototype.handleBossContact = function (enemy) {
    if (this.isBossStompCondition(enemy)) {
        let now = Date.now();
        if (now - (enemy.lastStompBounce || 0) < 3000) return;
        
        let attackMode = this.getBossAttackMode();
        if (attackMode !== 'bottle' && now - enemy.lastHit < 3000) return;
        
        this.executeBossStomp(enemy, now, attackMode);
        return;
    }
    
    if (Date.now() - enemy.lastHit < 2000) return;
    this.hurtCharacter(40);
};

/** Verifies if Pepe's fall path crossed the top of the chicken. */
World.prototype.checkChickenTopLanding = function (enemy) {
    let chickenTop = enemy.y + enemy.offset.top;
    let chickenLeft = enemy.x + enemy.offset.left;
    let chickenRight = enemy.x + enemy.width - enemy.offset.right;
    let recentFallSteps = this.character.lastFallSteps || [this.character.lastFallStep].filter(Boolean);
    let collisionTops = [chickenTop, enemy.previousCollisionTop].filter((top, i, tops) => Number.isFinite(top) && tops.indexOf(top) === i);
    
    return recentFallSteps.some(step =>
        Date.now() - step.time < 120 &&
        collisionTops.some(top => step.from <= top && step.to >= top) &&
        step.right > chickenLeft && step.left < chickenRight
    );
};

/** Applies a normal-chicken stomp only when Pepe crossed its top edge. */
World.prototype.handleChickenContact = function (enemy) {
    let pepeLeft = this.character.x + this.character.offset.left;
    let pepeRight = this.character.x + this.character.width - this.character.offset.right;
    let chickenLeft = enemy.x + enemy.offset.left;
    let chickenRight = enemy.x + enemy.width - enemy.offset.right;
    
    let landsOnTop = this.checkChickenTopLanding(enemy) && pepeRight > chickenLeft && pepeLeft < chickenRight;
    
    if (landsOnTop) {
        if (this.stompEnemy(enemy)) {
            this.character.lastFallStep = null;
            this.character.lastFallSteps = [];
            this.character.stompBounceUntil = Date.now() + 200;
        }
    } else if (Date.now() >= (this.character.stompBounceUntil || 0)) {
        this.hurtCharacter();
    }
};

/** Reduces Pepe's health after coin protection and starts death when needed. */
World.prototype.hurtCharacter = function (damage = 40) {
    if (typeof hasReviveProtection === 'function' &&
        hasReviveProtection(this.character)) return;
    if (this.character.isHurt() || this.character.isDead()) return;

    let coinsUsed = Math.min(this.collectedCoins, Math.ceil(damage / 10));
    this.collectedCoins -= coinsUsed;
    this.statusBarCoin.setPercentage((this.collectedCoins / this.maxCoins) * 100);

    let remainingDamage = Math.max(0, damage - coinsUsed * 10);
    this.character.energy = Math.max(0, this.character.energy - remainingDamage);

    this.statusBar.setPercentage(this.character.energy);
    this.character.lastHit = Date.now();

    if (this.character.isDead()) {
        return this.startPepeDeathSequence();
    }

    playRandomPepeHurtVoice();
};

/**
 * Damages a normal chicken after a valid stomp.
 * @param {Chicken} enemy The chicken Pepe landed on.
 * @returns {boolean} Whether the stomp was accepted.
 */
World.prototype.stompEnemy = function (enemy) {
    if (typeof hasReviveProtection === 'function' && hasReviveProtection(this.character)) return false;
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

/** Removes a defeated enemy after its death animation delay. */
World.prototype.removeEnemyAfterDelay = function (enemy, delay) {
    let currentLevel = this.level;

    setTimeout(() => {
        if (this !== world || this.level !== currentLevel) return;
        let idx = currentLevel.enemies.indexOf(enemy);
        if (idx > -1) currentLevel.enemies.splice(idx, 1);
    }, delay);
};

/** Checks every active bottle before playing its splash animation once. */
World.prototype.checkBottleCollisions = function () {
    this.throwableObjects.forEach(bottle => {
        if (bottle.isSplashed) return;

        let hitEnemies = this.level.enemies.filter(enemy => {
            let alive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;
            return alive && bottle.isColliding(enemy);
        });

        if (hitEnemies.length === 0) return;

        hitEnemies.forEach(enemy => this.handleBottleImpact(bottle, enemy));
        bottle.splash();
        this.removeBottleAfterDelay(bottle, 100);
    });
};

/** Handles bottle collision specifically for the Endboss. */
World.prototype.applyBossBottleImpact = function (bottle, enemy) {
    enemy.hadFirstContact = true;
    if (this.getBossAttackMode() === 'stomp') return;
    
    if (enemy.isHitOnHead(bottle) && Date.now() - enemy.lastHit >= 3000) {
        enemy.hit();
        playSpatialSound(AUDIO_HUB.bossHurt, enemy.x + enemy.width / 2);
        this.statusBarEndboss.setPercentage((enemy.energy / enemy.maxEnergy) * 100);
    }
};

/** Handles bottle collision for small chickens. */
World.prototype.applySmallChickenBottleImpact = function (bottle, enemy) {
    if (!bottle.hasPlayedSmallChickenHitSound) {
        playSpatialSound(AUDIO_HUB.smallChickenDead, enemy.x + enemy.width / 2);
        bottle.hasPlayedSmallChickenHitSound = true;
    }
    if (typeof enemy.die === 'function') enemy.die();
    this.removeEnemyAfterDelay(enemy, 500);
};

/** Handles bottle collision for normal chickens. */
World.prototype.applyChickenBottleDamage = function (bottle, enemy) {
    enemy.energy = Math.max(0, enemy.energy - 2);
    let isDead = enemy.energy === 0;
    let sound = isDead ? AUDIO_HUB.chickenDead1 : AUDIO_HUB.chickenStomp;
    
    if (!bottle.hasPlayedChickenHitSound) {
        playSpatialSound(sound, enemy.x + enemy.width / 2);
        bottle.hasPlayedChickenHitSound = true;
    }
    
    if (isDead) {
        enemy.die();
        this.removeEnemyAfterDelay(enemy, 500);
    } else {
        enemy.showStompReaction();
    }
};

/** Applies one bottle's damage and type-specific sound to an enemy. */
World.prototype.handleBottleImpact = function (bottle, enemy) {
    if (typeof hasReviveProtection === 'function' && hasReviveProtection(this.character)) return;
    
    if (enemy instanceof Endboss) return this.applyBossBottleImpact(bottle, enemy);
    if (enemy instanceof SmallChicken) return this.applySmallChickenBottleImpact(bottle, enemy);
    if (enemy instanceof Chicken) this.applyChickenBottleDamage(bottle, enemy);
};

/** Removes a splashed bottle after its short visual delay. */
World.prototype.removeBottleAfterDelay = function (bottle, delay) {
    setTimeout(() => {
        if (this !== world) return;
        let idx = this.throwableObjects.indexOf(bottle);
        if (idx > -1) this.throwableObjects.splice(idx, 1);
    }, delay);
};