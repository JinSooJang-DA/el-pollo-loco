
/**
 * Represents a thrown salsa bottle flying in an arc.
 * @extends MovableObject
 */
class ThrowableObject extends MovableObject {
    otherDirection = false;
    isSplashed = false;
    throwInterval;

    offset = {
        top: 15,
        bottom: 15,
        left: 10,
        right: 10
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
     * Initializes the thrown bottle.
     * @param {number} x
     * @param {number} y
     * @param {boolean} otherDirection
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

    /** Starts bottle flight. */
    throw() {
        this.speedY = 30;
        this.applyGravity();

        this.throwInterval = setInterval(() => {
            if (!this.isSplashed) {
                this.x += this.otherDirection ? -8 : 8;
            }
        }, 25);
    }

    /** Plays rotating or splash animation. */
    animate() {
        setInterval(() => {
            if (this.isSplashed) {
                this.playAnimation(this.IMAGES_SPLASH);
            } else {
                this.playAnimation(this.IMAGES_ROTATING);
            }
        }, 60);
    }

    /** Stops bottle movement after collision. */
    splash() {
        this.isSplashed = true;
        this.speedY = 0;
        clearInterval(this.throwInterval);
    }

    /** Returns whether bottle is still airborne. */
    isAboveGround() {
        return !this.isSplashed;
    }
}
