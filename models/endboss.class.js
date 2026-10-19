/**
 * Represents the final Endboss chicken.
 * @extends MovableObject
 */
class Endboss extends MovableObject {
    height = 400;
    width = 250;
    y = 55;
    speed = 3;
    energy = 100;
    hadFirstContact = false;
    deathAnimationFinished = false;
    animationStep = 0;

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

    /**
     * Reduces boss energy when hit by a thrown bottle.
     */
    hit() {
        this.energy -= 20;
        if (this.energy < 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime();
        }
    }

    /**
     * Initiates main animation and state loop for the boss.
     */
    animate() {
        let mainInterval = setInterval(() => {
            if (this.isDead()) {
                clearInterval(mainInterval);
                this.startDeathSequence();
            } else {
                this.handleBossActions();
            }
        }, 150);
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
            this.playAnimation(this.IMAGES_ATTACK);
            this.chaseCharacter();
        }
        if (this.hadFirstContact) this.animationStep++;
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
            this.y += 15;
            if (this.y > 600) {
                clearInterval(fallInterval);
                this.deathAnimationFinished = true;
            }
        }, 1000 / 30);
    }

    /** Chases Pepe after the boss fight begins. */
    chaseCharacter() {
        if (!this.hadFirstContact || !world || !world.character) return;

        if (world.character.x > this.x + 50) {
            this.otherDirection = true;
            this.x += 15;
        } else if (world.character.x < this.x - 50) {
            this.otherDirection = false;
            this.x -= 15;
        }
    }
}