/**
 * Represents a small, fast chicken enemy.
 * @extends MovableObject
 */
class SmallChicken extends MovableObject {
    y = 375;
    height = 50;
    width = 50;
    isDeadChicken = false;

    offset = { top: 5, bottom: 5, left: 5, right: 5 };

    IMAGES_WALKING = [
        'img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
        'img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
        'img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
    ];

    IMAGE_DEAD = 'img/3_enemies_chicken/chicken_small/2_dead/dead.png';

    /**
     * Creates a small chicken enemy.
     * @param {number} [x] Horizontal spawn coordinate.
     */
    constructor(x) {
        super();
        this.loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.x = x || 600 + Math.random() * 1500;
        this.speed = 0.25 + Math.random() * 0.45;
        this.animate();
    }

    /** Starts movement and walking animation loops. */
    animate() {
        this.startMovementInterval();
        this.startAnimationInterval();
    }

    /** Tracks Pepe's position and adjusts horizontal movement accordingly. */
    startMovementInterval() {
        setInterval(() => {
            if (this.isDeadChicken || isPaused || !world) return;

            if (world.character.x < this.x) {
                this.moveLeft();
                this.otherDirection = false;
            } else if (world.character.x > this.x) {
                this.moveRight();
                this.otherDirection = true;
            }
        }, 1000 / 60);
    }

    /** Iterates over the walking sprites periodically. */
    startAnimationInterval() {
        setInterval(() => {
            if (isPaused) return;
            if (!this.isDeadChicken) this.playAnimation(this.IMAGES_WALKING);
        }, 100);
    }

    /** Eliminates small chicken and shows flattened sprite. */
    die() {
        this.isDeadChicken = true;
        this.loadImage(this.IMAGE_DEAD);
    }

    /**
     * Checks whether small chicken is dead.
     * @returns {boolean} True if the small chicken is dead.
     */
    isDead() {
        return this.isDeadChicken;
    }
}