/**
 * Represents a thrown salsa bottle flying in an arc.
 * @extends MovableObject
 */
class ThrowableObject extends MovableObject {
    otherDirection = false;
    isSplashed = false;
    hasPlayedSmallChickenHitSound = false;
    hasPlayedChickenHitSound = false;
    throwInterval;
    animationInterval;

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

    /** Triggers splash effects when the bottle hits the ground floor. */
    handleGroundImpact(groundY) {
        this.y = groundY - this.height;
        this.splash();
        
        // Remove the bottle after its splash animation.
        if (typeof world !== 'undefined' && world) {
            world.removeBottleAfterDelay(this, 450);
        }

        // Ground impact sound only.
        playBottleSmashAt(this.x + this.width / 2);
    }

    /** Starts bottle flight. */
    throw() {
        this.speedY = 30;
        this.applyGravity();

        this.throwInterval = setInterval(() => {
            if (isPaused || this.isSplashed) return;

            // Keep the current 20% shorter horizontal throw.
            this.x += this.otherDirection ? -8 : 8;

            // Bottle touches the ground.
            const groundY = 420;

            if (this.y + this.height >= groundY) {
                this.handleGroundImpact(groundY);
            }
        }, 25);
    }

    /** Plays rotating or splash animation. */
    animate() {
        this.animationInterval = setInterval(() => {
            if (isPaused) return;
            
            if (!this.isSplashed) {
                this.playAnimation(this.IMAGES_ROTATING);
            }
        }, 60);
    }

    /** Executes the sequence of splash frames sequentially. */
    runSplashFrames() {
        let frame = 0;
        
        // Play the splash animation exactly once.
        this.img = this.imageCache[this.IMAGES_SPLASH[frame]];

        let splashInterval = setInterval(() => {
            frame++;

            if (frame >= this.IMAGES_SPLASH.length) {
                clearInterval(splashInterval);
                return;
            }

            this.img = this.imageCache[this.IMAGES_SPLASH[frame]];
        }, 60);
    }

    /** Breaks the bottle and halts its movement. */
    splash() {
        if (this.isSplashed) return;

        this.isSplashed = true;
        this.speedY = 0;

        clearInterval(this.throwInterval);
        clearInterval(this.animationInterval);

        this.runSplashFrames();
    }

    /** Returns whether bottle is still airborne. */
    isAboveGround() {
        return !this.isSplashed;
    }
}