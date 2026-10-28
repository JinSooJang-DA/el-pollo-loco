/**
 * Extends World with collision and combat methods.
 */

/**
 * Checks Pepe's collision with every living enemy in the current level.
 */
World.prototype.checkCharacterCollisions = function () {
    this.level.enemies.forEach(enemy => {
        let isAlive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;
        enemy.previousCollisionTop = enemy.lastCollisionTop;
        enemy.lastCollisionTop = enemy.y + enemy.offset.top;

        if (isAlive && this.character.isColliding(enemy)) {
            this.handleEnemyContact(enemy);
        }
    });
};

/**
 * Routes an enemy collision to the matching damage or stomp handler.
 * @param {MovableObject} enemy The enemy instance Pepe collided with.
 */
World.prototype.handleEnemyContact = function (enemy) {
    if (typeof hasReviveProtection === 'function' && hasReviveProtection(this.character)) return;
    if (enemy instanceof SmallChicken) return this.hurtCharacter();
    if (enemy instanceof Endboss) return this.handleBossContact(enemy);
    this.handleChickenContact(enemy);
};

/**
 * Checks if Pepe meets the condition to stomp on the Endboss head.
 * @param {Endboss} enemy The Endboss instance.
 * @returns {boolean} True if the stomp condition is satisfied.
 */
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

/**
 * Validates cooldown conditions for stomping on the Endboss.
 * @param {Endboss} enemy The Endboss instance.
 * @param {number} now The current timestamp.
 * @param {string} attackMode The permitted damage rule for the level.
 * @returns {boolean} True if the boss can be stomped.
 */
World.prototype.canStompBoss = function (enemy, now, attackMode) {
    if (now - (enemy.lastStompBounce || 0) < 3000) return false;
    if (attackMode !== 'bottle' && now - enemy.lastHit < 3000) return false;
    return true;
};

/**
 * Executes bounce and applies damage according to the level rules.
 * @param {Endboss} enemy The Endboss instance.
 * @param {number} now The current timestamp.
 * @param {string} attackMode The permitted damage rule for the level.
 */
World.prototype.executeBossStomp = function (enemy, now, attackMode) {
    enemy.lastStompBounce = now;
    this.character.speedY = 15;
    if (attackMode === 'bottle') return;

    enemy.energy = Math.max(0, enemy.energy - 20);
    enemy.lastHit = now;
    this.statusBarEndboss.setPercentage((enemy.energy / enemy.maxEnergy) * 100);
    playSound(audioHub.bossHurt);
};

/**
 * Applies boss stomp rules or damages Pepe upon boss contact.
 * @param {Endboss} enemy The contacted Endboss instance.
 */
World.prototype.handleBossContact = function (enemy) {
    let now = Date.now();
    let attackMode = this.getBossAttackMode();

    if (this.isBossStompCondition(enemy)) {
        if (!this.canStompBoss(enemy, now, attackMode)) return;
        this.executeBossStomp(enemy, now, attackMode);
        return;
    }

    if (now - enemy.lastHit < 2000) return;
    this.hurtCharacter(40);
};

/**
 * Checks whether a fall step crosses the vertical top bounds.
 * @param {Object} step The recent fall coordinate record.
 * @param {number[]} collisionTops Candidate top positions.
 * @returns {boolean} True if crossing the vertical boundary.
 */
World.prototype.isFallCrossingTop = function (step, collisionTops) {
    return collisionTops.some(top => step.from <= top && step.to >= top);
};

/**
 * Checks whether a fall step falls within the horizontal enemy bounds.
 * @param {Object} step The recent fall coordinate record.
 * @param {Chicken} enemy The target chicken instance.
 * @returns {boolean} True if within horizontal bounds.
 */
World.prototype.isWithinHorizontalBounds = function (step, enemy) {
    let chickenLeft = enemy.x + enemy.offset.left;
    let chickenRight = enemy.x + enemy.width - enemy.offset.right;
    return step.right > chickenLeft && step.left < chickenRight;
};

/**
 * Verifies if Pepe's fall path crossed the top edge of the chicken.
 * @param {Chicken} enemy The target chicken instance.
 * @returns {boolean} True if the landing trajectory crossed the top.
 */
World.prototype.checkChickenTopLanding = function (enemy) {
    let chickenTop = enemy.y + enemy.offset.top;
    let recentSteps = this.character.lastFallSteps || [this.character.lastFallStep].filter(Boolean);
    let tops = [chickenTop, enemy.previousCollisionTop].filter((top, i, list) => Number.isFinite(top) && list.indexOf(top) === i);

    return recentSteps.some(step =>
        Date.now() - step.time < 120 &&
        this.isFallCrossingTop(step, tops) &&
        this.isWithinHorizontalBounds(step, enemy)
    );
};

/**
 * Resets falling history and applies bounce grace period upon valid stomp.
 * @param {Chicken} enemy The stomped chicken instance.
 */
World.prototype.processStompSuccess = function (enemy) {
    if (!this.stompEnemy(enemy)) return;
    this.character.lastFallStep = null;
    this.character.lastFallSteps = [];
    this.character.stompBounceUntil = Date.now() + 200;
};

/**
 * Evaluates whether Pepe successfully lands on a normal chicken.
 * @param {Chicken} enemy The collided normal chicken instance.
 */
World.prototype.handleChickenContact = function (enemy) {
    let pepeLeft = this.character.x + this.character.offset.left;
    let pepeRight = this.character.x + this.character.width - this.character.offset.right;
    let chickenLeft = enemy.x + enemy.offset.left;
    let chickenRight = enemy.x + enemy.width - enemy.offset.right;

    let landsOnTop = this.checkChickenTopLanding(enemy) && pepeRight > chickenLeft && pepeLeft < chickenRight;

    if (landsOnTop) {
        this.processStompSuccess(enemy);
    } else if (Date.now() >= (this.character.stompBounceUntil || 0)) {
        this.hurtCharacter();
    }
};

/**
 * Deducts coins to mitigate damage and returns the remainder.
 * @param {number} damage The incoming damage amount.
 * @returns {number} The remaining unmitigated damage.
 */
World.prototype.applyCoinDamageReduction = function (damage) {
    let coinsUsed = Math.min(this.collectedCoins, Math.ceil(damage / 10));
    this.collectedCoins -= coinsUsed;
    this.statusBarCoin.setPercentage((this.collectedCoins / this.maxCoins) * 100);
    return Math.max(0, damage - coinsUsed * 10);
};

/**
 * Reduces Pepe's health after coin mitigation and triggers death if necessary.
 * @param {number} [damage=40] The raw damage amount to apply.
 */
World.prototype.hurtCharacter = function (damage = 40) {
    if (typeof hasReviveProtection === 'function' && hasReviveProtection(this.character)) return;
    if (this.character.isHurt() || this.character.isDead()) return;

    let remainingDamage = this.applyCoinDamageReduction(damage);
    this.character.energy = Math.max(0, this.character.energy - remainingDamage);
    this.statusBar.setPercentage(this.character.energy);
    this.character.lastHit = Date.now();

    if (this.character.isDead()) return this.startPepeDeathSequence();
    playRandomPepeHurtVoice();
};

/**
 * Validates whether the enemy is eligible to be stomped.
 * @param {Chicken} enemy The enemy instance to validate.
 * @returns {boolean} True if the enemy can be stomped.
 */
World.prototype.canStompEnemy = function (enemy) {
    if (typeof hasReviveProtection === 'function' && hasReviveProtection(this.character)) return false;
    if (!(enemy instanceof Chicken)) return false;

    let now = Date.now();
    return (now - enemy.lastStomp >= enemy.stompCooldown);
};

/**
 * Applies damage to the chicken and triggers death or stomp reaction.
 * @param {Chicken} enemy The stomped chicken instance.
 */
World.prototype.applyChickenDamage = function (enemy) {
    enemy.energy -= 1;
    this.character.speedY = 15;

    if (enemy.energy <= 0) {
        enemy.energy = 0;
        playSound(audioHub.chickenDead1);
        enemy.die();
        this.removeEnemyAfterDelay(enemy, 500);
        return;
    }
    playSound(audioHub.chickenStomp);
    enemy.showStompReaction();
};

/**
 * Damages a normal chicken after a valid stomp and triggers bounce.
 * @param {Chicken} enemy The chicken Pepe landed on.
 * @returns {boolean} True if the stomp was valid and processed.
 */
World.prototype.stompEnemy = function (enemy) {
    if (!this.canStompEnemy(enemy)) return false;

    enemy.lastStomp = Date.now();
    this.applyChickenDamage(enemy);
    return true;
};

/**
 * Safely removes a defeated enemy after its death animation finishes.
 * @param {MovableObject} enemy The enemy instance to remove.
 * @param {number} delay Delay time in milliseconds.
 */
World.prototype.removeEnemyAfterDelay = function (enemy, delay) {
    let currentLevel = this.level;

    setTimeout(() => {
        if (this !== world || this.level !== currentLevel) return;
        let idx = currentLevel.enemies.indexOf(enemy);
        if (idx > -1) currentLevel.enemies.splice(idx, 1);
    }, delay);
};

/**
 * Checks active thrown bottles for enemy collisions and triggers splash.
 */
World.prototype.checkBottleCollisions = function () {
    this.throwableObjects.forEach(bottle => {
        if (!bottle.isSplashed) this.checkSingleBottle(bottle);
    });
};

/**
 * Resolves one thrown bottle against all living enemies.
 * @param {ThrowableObject} bottle The thrown bottle instance.
 */
World.prototype.checkSingleBottle = function (bottle) {
    let hitEnemies = this.level.enemies.filter(enemy => this.isLivingBottleTarget(bottle, enemy));

    if (hitEnemies.length === 0) return;
    hitEnemies.forEach(enemy => this.handleBottleImpact(bottle, enemy));
    bottle.splash();
    this.removeBottleAfterDelay(bottle, 100);
};

/**
 * Returns whether a bottle currently overlaps a living enemy.
 * @param {ThrowableObject} bottle The thrown bottle.
 * @param {MovableObject} enemy The enemy to test.
 * @returns {boolean} True if the enemy is alive and hit.
 */
World.prototype.isLivingBottleTarget = function (bottle, enemy) {
    let alive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;
    return alive && bottle.isColliding(enemy);
};

/**
 * Handles Endboss bottle hits and head-damage verification.
 * @param {ThrowableObject} bottle The thrown bottle object.
 * @param {Endboss} enemy The target Endboss instance.
 */
World.prototype.applyBossBottleImpact = function (bottle, enemy) {
    enemy.hadFirstContact = true;
    if (this.getBossAttackMode() === 'stomp') return;

    if (enemy.isHitOnHead(bottle) && Date.now() - enemy.lastHit >= 3000) {
        enemy.hit();
        playSpatialSound(audioHub.bossHurt, enemy.x + enemy.width / 2);
        this.statusBarEndboss.setPercentage((enemy.energy / enemy.maxEnergy) * 100);
    }
};

/**
 * Handles small chicken bottle hits and immediate defeat.
 * @param {ThrowableObject} bottle The thrown bottle object.
 * @param {SmallChicken} enemy The target small chicken instance.
 */
World.prototype.applySmallChickenBottleImpact = function (bottle, enemy) {
    if (!bottle.hasPlayedSmallChickenHitSound) {
        playSpatialSound(audioHub.smallChickenDead, enemy.x + enemy.width / 2);
        bottle.hasPlayedSmallChickenHitSound = true;
    }
    if (typeof enemy.die === 'function') enemy.die();
    this.removeEnemyAfterDelay(enemy, 500);
};

/**
 * Handles normal chicken bottle hits and damage calculation.
 * @param {ThrowableObject} bottle The thrown bottle object.
 * @param {Chicken} enemy The target normal chicken instance.
 */
World.prototype.applyChickenBottleDamage = function (bottle, enemy) {
    enemy.energy = Math.max(0, enemy.energy - 2);
    let isDead = enemy.energy === 0;

    this.playChickenHitSound(bottle, enemy, isDead);
    this.applyChickenHitResult(enemy, isDead);
};

/**
 * Plays the chicken impact sound once per thrown bottle.
 * @param {ThrowableObject} bottle The thrown bottle.
 * @param {Chicken} enemy The struck chicken.
 * @param {boolean} isDead Whether the hit killed the chicken.
 */
World.prototype.playChickenHitSound = function (bottle, enemy, isDead) {
    if (bottle.hasPlayedChickenHitSound) return;

    let sound = isDead ? audioHub.chickenDead1 : audioHub.chickenStomp;
    playSpatialSound(sound, enemy.x + enemy.width / 2);
    bottle.hasPlayedChickenHitSound = true;
};

/**
 * Routes a surviving or defeated chicken hit to its follow-up action.
 * @param {Chicken} enemy The struck chicken.
 * @param {boolean} isDead Whether the hit killed the chicken.
 */
World.prototype.applyChickenHitResult = function (enemy, isDead) {
    if (!isDead) return enemy.showStompReaction();

    enemy.die();
    this.removeEnemyAfterDelay(enemy, 500);
};

/**
 * Routes bottle contact to enemy-type specific impact handlers.
 * @param {ThrowableObject} bottle The thrown bottle object.
 * @param {MovableObject} enemy The struck enemy instance.
 */
World.prototype.handleBottleImpact = function (bottle, enemy) {
    if (typeof hasReviveProtection === 'function' && hasReviveProtection(this.character)) return;
    if (enemy instanceof Endboss) return this.applyBossBottleImpact(bottle, enemy);
    if (enemy instanceof SmallChicken) return this.applySmallChickenBottleImpact(bottle, enemy);
    if (enemy instanceof Chicken) this.applyChickenBottleDamage(bottle, enemy);
};

/**
 * Removes a splashed bottle instance from the active collection.
 * @param {ThrowableObject} bottle The bottle instance to remove.
 * @param {number} delay Delay time in milliseconds.
 */
World.prototype.removeBottleAfterDelay = function (bottle, delay) {
    setTimeout(() => {
        if (this !== world) return;
        let idx = this.throwableObjects.indexOf(bottle);
        if (idx > -1) this.throwableObjects.splice(idx, 1);
    }, delay);
};