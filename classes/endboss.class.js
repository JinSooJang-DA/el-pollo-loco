/**
 * Represents the final Endboss chicken.
 * @extends MovableObject
 */
class Endboss extends MovableObject {
    height = 285;
    width = 178;
    y = 170;
    speed = 3;
    energy = 100;
    hadFirstContact = false;
    deathAnimationFinished = false;
    animationStep = 0;
    lastSpecialAttack = Date.now();
    isPreparingAttack = false;
    isCharging = false;
    specialAttackTimer = null;
    specialAttackDeadline = 0;
    specialAttackNextPhase = null;
    specialAttackRemaining = 0;

    offset = {
        top: 60,
        bottom: 20,
        left: 30,
        right: 30
    };

    IMAGES_ALERT = [
        'img/4_enemie_boss_chicken/2_alert/G6.png',
        'img/4_enemie_boss_chicken/2_alert/G7.png',
        'img/4_enemie_boss_chicken/2_alert/G8.png',
        'img/4_enemie_boss_chicken/2_alert/G9.png',
        'img/4_enemie_boss_chicken/2_alert/G10.png',
        'img/4_enemie_boss_chicken/2_alert/G11.png',
        'img/4_enemie_boss_chicken/2_alert/G12.png'
    ];

    IMAGES_ATTACK = [
        'img/4_enemie_boss_chicken/3_attack/G13.png',
        'img/4_enemie_boss_chicken/3_attack/G14.png',
        'img/4_enemie_boss_chicken/3_attack/G15.png',
        'img/4_enemie_boss_chicken/3_attack/G16.png',
        'img/4_enemie_boss_chicken/3_attack/G17.png',
        'img/4_enemie_boss_chicken/3_attack/G18.png',
        'img/4_enemie_boss_chicken/3_attack/G19.png',
        'img/4_enemie_boss_chicken/3_attack/G20.png'
    ];

    IMAGES_HURT = [
        'img/4_enemie_boss_chicken/4_hurt/G21.png',
        'img/4_enemie_boss_chicken/4_hurt/G22.png',
        'img/4_enemie_boss_chicken/4_hurt/G23.png'
    ];

    IMAGES_DEAD = [
        'img/4_enemie_boss_chicken/5_dead/G24.png',
        'img/4_enemie_boss_chicken/5_dead/G25.png',
        'img/4_enemie_boss_chicken/5_dead/G26.png'
    ];

    /**
     * Initializes the Endboss position, images, and loop.
     */
    constructor() {
        super().loadImage(this.IMAGES_ALERT[0]);
        this.loadImages(this.IMAGES_ALERT);
        this.loadImages(this.IMAGES_ATTACK);
        this.loadImages(this.IMAGES_HURT);
        this.loadImages(this.IMAGES_DEAD);
        this.x = 2000;
        this.animate();
    }

    /** Evaluates if a bottle collision struck the boss's head area. */
    isHitOnHead(bottle) {
        let headX = this.otherDirection
            ? this.x + this.width * 0.52
            : this.x + this.width * 0.08;

        let headY = this.y + this.height * 0.13;
        let headWidth = this.width * 0.38;
        let headHeight = this.height * 0.30;

        return bottle.x + bottle.width > headX &&
            bottle.x < headX + headWidth &&
            bottle.y + bottle.height > headY &&
            bottle.y < headY + headHeight;
    }

    /**
     * Reduces boss energy when hit by a thrown bottle.
     */
    hit() {
        this.energy -= 10;
        if (this.energy < 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime();
        }
    }

    /** Moves the boss according to its current combat phase. */
    updateBossMovement() {
        if (isPaused || this.isDead()) return;
        if (!this.hadFirstContact || this.animationStep < 10) return;
        if (this.isHurt() || this.isPreparingAttack) return;

        if (this.isCharging) {
            this.chargeCharacter(18);
        } else {
            this.chaseCharacter(6);
        }
    }

    /**
     * Initiates main animation and state loop for the boss.
     */
    animate() {
        let mainInterval = setInterval(() => this.runMainLoop(mainInterval, moveInterval), 150);

        let moveInterval = setInterval(() => this.updateBossMovement(), 50);
    }

    /**
     * Runs one boss animation tick or starts the death sequence.
     * @param {number} mainInterval The main animation interval ID.
     * @param {number} moveInterval The movement interval ID.
     */
    runMainLoop(mainInterval, moveInterval) {
        if (isPaused) return;

        if (!this.isDead()) return this.handleBossActions();

        clearInterval(mainInterval);
        clearInterval(moveInterval);
        this.startDeathSequence();
    }

    /** Manages the animation sequences during combat engagement. */
    handleActiveBossAnimation() {
        if (this.isPreparingAttack) {
            this.playAnimation(this.IMAGES_ALERT);
        } else if (this.isCharging) {
            this.playAnimation(this.IMAGES_ATTACK);
        } else {
            this.playAnimation(this.IMAGES_ATTACK);
            this.checkSpecialAttack();
        }
    }

    /**
     * Handles hurt, alert, and attack behaviors depending on current state.
     */
    handleBossActions() {
        this.checkContactTrigger();

        if (this.isHurt()) {
            this.playAnimation(this.IMAGES_HURT);
        } else if (!this.hadFirstContact || this.animationStep < 10) {
            this.playAnimation(this.IMAGES_ALERT);
        } else {
            this.handleActiveBossAnimation();
        }

        if (this.hadFirstContact) this.animationStep++;
    }

    /** Determines if the boss should trigger a special charge attack. */
    checkSpecialAttack() {
        if (Date.now() - this.lastSpecialAttack < 4000) return;

        this.isPreparingAttack = true;
        this.lastSpecialAttack = Date.now();
        this.scheduleSpecialAttackPhase('charge', 1000);
    }

    /** Schedules one pause-aware Endboss attack phase. */
    scheduleSpecialAttackPhase(nextPhase, delay) {
        this.specialAttackNextPhase = nextPhase;
        this.specialAttackDeadline = Date.now() + delay;
        this.specialAttackTimer = setTimeout(() => {
            this.completeSpecialAttackPhase();
        }, delay);
    }

    /** Applies the current Endboss attack phase after its delay finishes. */
    completeSpecialAttackPhase() {
        this.specialAttackTimer = null;
        if (this.isDead()) return;

        if (this.specialAttackNextPhase === 'charge') {
            return this.startChargePhase();
        }

        this.finishAttackPhase();
    }

    /** Switches the boss into its charge phase and schedules the finish. */
    startChargePhase() {
        this.isPreparingAttack = false;
        this.isCharging = true;
        this.scheduleSpecialAttackPhase('finish', 1000);
    }

    /** Clears all active special-attack state after the charge ends. */
    finishAttackPhase() {
        this.isCharging = false;
        this.specialAttackNextPhase = null;
        this.specialAttackRemaining = 0;
    }

    /** Stores the remaining Endboss attack delay while gameplay is paused. */
    pauseSpecialAttack() {
        if (!this.specialAttackTimer) return;

        clearTimeout(this.specialAttackTimer);
        this.specialAttackTimer = null;
        this.specialAttackRemaining = Math.max(
            0,
            this.specialAttackDeadline - Date.now()
        );
    }

    /** Continues a paused Endboss attack delay after gameplay resumes. */
    resumeSpecialAttack() {
        if (!this.specialAttackNextPhase || this.specialAttackTimer || this.isDead()) {
            return;
        }

        this.scheduleSpecialAttackPhase(
            this.specialAttackNextPhase,
            this.specialAttackRemaining
        );
        this.specialAttackRemaining = 0;
    }

    /**
     * Checks distance to character to trigger first boss contact.
     */
    checkContactTrigger() {
        if (world && !this.hadFirstContact) {
            let distance = Math.abs(this.x - world.character.x);
            if (world.character.x > 1600 || distance < 600) {
                this.animationStep = 0;
                this.hadFirstContact = true;
            }
        }
    }

    /**
     * Executes the sequence of dead sprites upon defeat.
     */
    startDeathSequence() {
        let frame = 0;
        let deadInterval = setInterval(() => {
            if (isPaused) return;
            
            if (frame < this.IMAGES_DEAD.length) {
                this.img = this.imageCache[this.IMAGES_DEAD[frame]];
                frame++;
            } else {
                clearInterval(deadInterval);
                this.startFallAnimation();
            }
        }, 200);
    }

    /**
     * Causes the boss to drop downward off the screen.
     */
    startFallAnimation() {
        let fallInterval = setInterval(() => {
            if (isPaused) return;
            this.y += 15;
            if (this.y > 600) {
                clearInterval(fallInterval);
                this.deathAnimationFinished = true;
            }
        }, 1000 / 30);
    }

    /** Chases Pepe after the boss fight begins. */
    chaseCharacter(step = 18) {
        if (!this.hadFirstContact || !world || !world.character) return;

        if (world.character.x > this.x + 50) {
            this.otherDirection = true;
            this.x += step;
        } else if (world.character.x < this.x - 50) {
            this.otherDirection = false;
            this.x -= step;
        }
    }

    /** Makes the boss perform its high-speed dash attack. */
    chargeCharacter(step = 54) {
        if (!world || !world.character) return;

        if (this.otherDirection) {
            this.x += step;
        } else {
            this.x -= step;
        }

        this.x = Math.max(
            0,
            Math.min(this.x, world.level.level_end_x - this.width)
        );
    }
}