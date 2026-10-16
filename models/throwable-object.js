/**
 * Represents a thrown salsa bottle flying in arc trajectory.
 * @extends MovableObject
 */
class ThrowableObject extends MovableObject {
    otherDirection = false;
    isSplashed = false;
    throwInterval;

    offset = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    };

    IMAGES_ROTATING = [
        'img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
        'img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
        'img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
        'img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png'
    ];

    IMAGES_SPLASH = [
        'img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
        'img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
        'img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
        'img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
        'img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png',
        'img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png'
    ];

    /**
     * Initializes thrown bottle position and flight path.
     * @param {number} x - Starting horizontal coordinate.
     * @param {number} y - Starting vertical coordinate.
     * @param {boolean} otherDirection - Whether bottle travels to the left.
     */
    constructor(x, y, otherDirection) {
        super().loadImage(this.IMAGES_ROTATING[0]);
        this.loadImages(this.IMAGES_ROTATING);
        this.loadImages(this.IMAGES_SPLASH);
        this.x = x;
        this.y = y;
        this.otherDirection = otherDirection;
        this.height = 60;
        this.width = 50;
        this.throw();
        this.animate();
    }

    /**
     * Initiates upward velocity and continuous horizontal travel.
     */
    throw() {
        this.speedY = 30;
        this.applyGravity();
        this.throwInterval = setInterval(() => {
            if (!this.isSplashed) {
                this.x += this.otherDirection ? -10 : 10;
            }
        }, 25);
    }

    /**
     * Loops rotating or splash animation sequences.
     */
    animate() {
        setInterval(() => {
            if (this.isSplashed) {
                this.playAnimation(this.IMAGES_SPLASH);
            } else {
                this.playAnimation(this.IMAGES_ROTATING);
            }
        }, 60);
    }

    /**
     * Triggers bottle smash, stopping flight and falling physics.
     */
    splash() {
        this.isSplashed = true;
        this.speedY = 0;
        clearInterval(this.throwInterval);
    }

    /**
     * Checks if bottle is airborne and eligible for gravity.
     * @returns {boolean} True if bottle has not splashed yet.
     */
    isAboveGround() {
        return !this.isSplashed;
    }
}