
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
    lastRecoveryTime = 0;
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

    /** Initializes Pepe's images and animation loops. */
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

    /** Remembers when Pepe lands after falling. */
    handleGroundContact() {
        let wasFalling = this.speedY < 0;

        super.handleGroundContact();

        if (wasFalling) {
            this.lastLandingTime = Date.now();
        }
    }

    /** Starts movement and animation intervals. */
    animate() {
        setInterval(() => this.processMovement(), 1000 / 60);
        setInterval(() => this.processAnimations(), 150);
    }

    /**
     * Handles movement and jump input.
     * @returns {boolean}
     */
    /** Handles walking and jumping input. */
    handleWalkAndJump() {
        let movedRight = this.walkRight();
        let movedLeft = this.walkLeft();
        if (this.world.keyboard.SPACE && !this.isAboveGround()) {
            this.jump();
            return true;
        }
        return movedRight || movedLeft;
    }

    /** Moves Pepe to the right if possible. */
    walkRight() {
        if (!this.world.keyboard.RIGHT) return false;
        if (this.x >= this.world.level.level_end_x) return false;
        this.moveRight();
        this.otherDirection = false;
        return true;
    }

    /** Moves Pepe to the left if possible. */
    walkLeft() {
        if (!this.world.keyboard.LEFT || this.x <= 0) return false;
        this.moveLeft();
        this.otherDirection = true;
        return true;
    }

    /** Updates the camera smoothly around the boss. */


    updateCameraPosition() {
        let screenWidth = this.world.canvas.width;

        // Pepe's visible body center, considering the collision offsets.
        let pepeCenter = this.x + this.offset.left +
            (this.width - this.offset.left - this.offset.right) / 2;

        // Leave more space in the direction Pepe is facing.
        let targetPosition = this.otherDirection
            ? screenWidth * 0.85
            : screenWidth * 0.15;

        let targetCameraX = targetPosition - pepeCenter;

        // Keep the camera inside the level boundaries.
        let maxScroll = Math.max(
            0,
            this.world.level.level_end_x + this.width - screenWidth
        );

        targetCameraX = Math.max(
            -maxScroll,
            Math.min(0, targetCameraX)
        );

        // Smooth camera movement.
        this.world.camera_x +=
            (targetCameraX - this.world.camera_x) * 0.08;
    }



    /** Plays Pepe's death animation. */
    playDeathAnimation() {
        let idx = Math.min(this.deadFrameIndex, this.IMAGES_DEAD.length - 1);
        this.img = this.imageCache[this.IMAGES_DEAD[idx]];
        if (this.deadFrameIndex < this.IMAGES_DEAD.length - 1) {
            this.deadFrameIndex++;
        }
    }

    /** Handles walking and idle animations. */
    handleGroundState() {
        if (this.world && (this.world.keyboard.RIGHT || this.world.keyboard.LEFT)) {
            this.playAnimation(this.IMAGES_WALKING);
            if (AUDIO_HUB.run.paused && !isMuted && !isPaused) {
                playSound(AUDIO_HUB.run);
            }
        } else {
            AUDIO_HUB.run.pause();
            AUDIO_HUB.run.currentTime = 0;
            this.handleIdleAnimation();
        }
    }

    /** Shows idle or sleeping animation. */
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

    /** Makes Pepe jump and plays the jump sound. */
    jump() {
        this.speedY = 30;
        if (typeof playSound === 'function' && typeof AUDIO_HUB !== 'undefined') {
            playSound(AUDIO_HUB.jump);
        }
    }

    /** Processes input and updates the camera. */
    processMovement() {
        if (!this.world || this.isDead() || isPaused) return;
        let isMoving = this.handleWalkAndJump();
        if (isMoving || this.world.keyboard.D) {
            this.resetIdleTimer();
        }
        this.updateCameraPosition();
    }

    /** Plays the correct animation for Pepe's state. */
    processAnimations() {
        if (isPaused) return AUDIO_HUB.run.pause();
        if (this.isDead() || this.isHurt() || this.isAboveGround()) {
            AUDIO_HUB.run.pause();
            AUDIO_HUB.run.currentTime = 0;
        }
        if (this.isDead()) return this.playDeathAnimation();
        if (this.isHurt() || this.isAboveGround()) {
            this.playAnimation(this.isHurt() ? this.IMAGES_HURT : this.IMAGES_JUMPING);
            this.resetIdleTimer();
        } else {
            this.handleGroundState();
        }
    }

    /** Resets idle time and stops the snoring sound. */
    resetIdleTimer() {
        this.lastActionTime = new Date().getTime();
        if (typeof AUDIO_HUB !== 'undefined' && AUDIO_HUB.pepeSnore && !AUDIO_HUB.pepeSnore.paused) {
            AUDIO_HUB.pepeSnore.pause();
            AUDIO_HUB.pepeSnore.currentTime = 0;
        }
    }

}
