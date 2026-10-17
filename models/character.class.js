/**
 * Represents the playable hero Pepe.
 * @extends MovableObject
 */
class Character extends MovableObject {
    height = 280;
    width = 120;
    y = 150;
    speed = 10;
    world;
    lastActionTime = new Date().getTime();
    deadFrameIndex = 0;

    offset = {
        top: 120,
        bottom: 30,
        left: 40,
        right: 30
    };

    IMAGES_IDLE = [
        'img/2_character_pepe/1_idle/idle/I-1.png',
        'img/2_character_pepe/1_idle/idle/I-2.png',
        'img/2_character_pepe/1_idle/idle/I-3.png',
        'img/2_character_pepe/1_idle/idle/I-4.png',
        'img/2_character_pepe/1_idle/idle/I-5.png',
        'img/2_character_pepe/1_idle/idle/I-6.png',
        'img/2_character_pepe/1_idle/idle/I-7.png',
        'img/2_character_pepe/1_idle/idle/I-8.png',
        'img/2_character_pepe/1_idle/idle/I-9.png',
        'img/2_character_pepe/1_idle/idle/I-10.png'
    ];

    IMAGES_LONG_IDLE = [
        'img/2_character_pepe/1_idle/long_idle/I-11.png',
        'img/2_character_pepe/1_idle/long_idle/I-12.png',
        'img/2_character_pepe/1_idle/long_idle/I-13.png',
        'img/2_character_pepe/1_idle/long_idle/I-14.png',
        'img/2_character_pepe/1_idle/long_idle/I-15.png',
        'img/2_character_pepe/1_idle/long_idle/I-16.png',
        'img/2_character_pepe/1_idle/long_idle/I-17.png',
        'img/2_character_pepe/1_idle/long_idle/I-18.png',
        'img/2_character_pepe/1_idle/long_idle/I-19.png',
        'img/2_character_pepe/1_idle/long_idle/I-20.png'
    ];

    IMAGES_WALKING = [
        'img/2_character_pepe/2_walk/W-21.png',
        'img/2_character_pepe/2_walk/W-22.png',
        'img/2_character_pepe/2_walk/W-23.png',
        'img/2_character_pepe/2_walk/W-24.png',
        'img/2_character_pepe/2_walk/W-25.png',
        'img/2_character_pepe/2_walk/W-26.png'
    ];

    IMAGES_JUMPING = [
        'img/2_character_pepe/3_jump/J-31.png',
        'img/2_character_pepe/3_jump/J-32.png',
        'img/2_character_pepe/3_jump/J-33.png',
        'img/2_character_pepe/3_jump/J-34.png',
        'img/2_character_pepe/3_jump/J-35.png',
        'img/2_character_pepe/3_jump/J-36.png',
        'img/2_character_pepe/3_jump/J-37.png',
        'img/2_character_pepe/3_jump/J-38.png',
        'img/2_character_pepe/3_jump/J-39.png'
    ];

    IMAGES_HURT = [
        'img/2_character_pepe/4_hurt/H-41.png',
        'img/2_character_pepe/4_hurt/H-42.png',
        'img/2_character_pepe/4_hurt/H-43.png'
    ];

    IMAGES_DEAD = [
        'img/2_character_pepe/5_dead/D-51.png',
        'img/2_character_pepe/5_dead/D-52.png',
        'img/2_character_pepe/5_dead/D-53.png',
        'img/2_character_pepe/5_dead/D-54.png',
        'img/2_character_pepe/5_dead/D-55.png',
        'img/2_character_pepe/5_dead/D-56.png',
        'img/2_character_pepe/5_dead/D-57.png'
    ];

    /**
     * Creates and initializes the character animations and physics.
     */
    constructor() {
        super().loadImage('img/2_character_pepe/2_walk/W-21.png');
        this.loadImages(this.IMAGES_IDLE);
        this.loadImages(this.IMAGES_LONG_IDLE);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_JUMPING);
        this.loadImages(this.IMAGES_HURT);
        this.loadImages(this.IMAGES_DEAD);
        this.applyGravity();
        this.animate();
    }

    /**
     * Starts interval timers for character movement and animation cycles.
     */
    animate() {
        setInterval(() => this.processMovement(), 1000 / 60);
        setInterval(() => this.processAnimations(), 150);
    }

    /**
     * Processes input checks, character position updates, and camera following.
     */
    processMovement() {
        if (!this.world || this.isDead()) return;
        let isMoving = this.handleWalkAndJump();
        if (isMoving || this.world.keyboard.D) {
            this.resetIdleTimer();
        }
        this.updateCameraPosition();
    }

    /**
     * Evaluates horizontal walking and jumping inputs.
     * @returns {boolean} True if any movement action was performed.
     */
    handleWalkAndJump() {
        let acted = false;
        if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
            this.moveRight();
            this.otherDirection = false;
            acted = true;
        }
        if (this.world.keyboard.LEFT && this.x > 0) {
            this.moveLeft();
            this.otherDirection = true;
            acted = true;
        }
        if (this.world.keyboard.SPACE && !this.isAboveGround()) {
            this.jump();
            acted = true;
        }
        return acted;
    }

    /**
     * Synchronizes world camera position with character location within bounds.
     */
    updateCameraPosition() {
        let maxCameraX = -(this.world.level.level_end_x - 620);
        let targetCameraX = -this.x + 100;
        this.world.camera_x = Math.max(targetCameraX, maxCameraX);
    }

    /**
     * Resolves the visual state and plays corresponding sprite sequence.
     */
    processAnimations() {
        if (this.isDead()) {
            this.playDeathAnimation();
        } else if (this.isHurt()) {
            this.playAnimation(this.IMAGES_HURT);
            this.resetIdleTimer();
        } else if (this.isAboveGround()) {
            this.playAnimation(this.IMAGES_JUMPING);
            this.resetIdleTimer();
        } else {
            this.handleGroundState();
        }
    }

    /**
     * Plays death animation frames sequentially until the final frame.
     */
    playDeathAnimation() {
        let idx = Math.min(this.deadFrameIndex, this.IMAGES_DEAD.length - 1);
        this.img = this.imageCache[this.IMAGES_DEAD[idx]];
        if (this.deadFrameIndex < this.IMAGES_DEAD.length - 1) {
            this.deadFrameIndex++;
        }
    }

    /**
     * Handles sprite switching while on the ground (walking vs idle).
     */
    handleGroundState() {
        if (this.world && (this.world.keyboard.RIGHT || this.world.keyboard.LEFT)) {
            this.playAnimation(this.IMAGES_WALKING);
        } else {
            this.handleIdleAnimation();
        }
    }

    /**
     * Resets the idle activity timestamp to current time.
     */
    resetIdleTimer() {
        this.lastActionTime = new Date().getTime();
    }

    /**
     * Decides between short breathing idle and long sleeping idle animation.
     */
    handleIdleAnimation() {
        let timePassed = (new Date().getTime() - this.lastActionTime) / 1000;
        if (timePassed > 4) {
            this.playAnimation(this.IMAGES_LONG_IDLE);
            if (typeof AUDIO_HUB !== 'undefined' && AUDIO_HUB.pepeSnore && AUDIO_HUB.pepeSnore.paused) {
                playSound(AUDIO_HUB.pepeSnore);
            }
        } else {
            this.playAnimation(this.IMAGES_IDLE);
        }
    }

    /**
     * Sets vertical speed for jumping.
     */
    jump() {
        this.speedY = 30;
    }
}