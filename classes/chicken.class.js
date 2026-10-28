/**
 * Represents a standard walking chicken enemy.
 * @extends MovableObject
 */
class Chicken extends MovableObject {
    height = 50;
    width = 65;
    y = 370;
    isDeadChicken = false;
    maxEnergy = 3;
    energy = 3;
    lastStomp = 0;
    stompCooldown = 300;
    normalHeight = 50;
    normalY = 370;
    stompedHeight = 42;
    stompedY = 378;
    isStompReacting = false;

    walkInterval;
    animationInterval;

    offset = {
        top: 8,
        bottom: 5,
        left: 8,
        right: 8
    };

    IMAGES_WALKING = [
        'img/3_enemies_chicken/chicken_normal/1_walk/1_w.png',
        'img/3_enemies_chicken/chicken_normal/1_walk/2_w.png',
        'img/3_enemies_chicken/chicken_normal/1_walk/3_w.png'
    ];

    IMAGE_DEAD = 'img/3_enemies_chicken/chicken_normal/2_dead/dead.png';

    /**
     * Creates and places a chicken enemy.
     * @param {number} [x] - Initial horizontal spawn position.
     */
    constructor(x) {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.x = x !== undefined ? x : 600 + Math.random() * 1200;
        this.speed = 0.15 + Math.random() * 0.5;
        this.animate();
    }

    /** Updates the chicken's movement direction relative to Pepe. */
    updateChickenMovement() {
        if (!this.canUpdateChickenMovement()) return;

        let distance = this.getCharacterDistance();

        // Stop only after the collision boxes actually touch.
        if (this.isColliding(world.character)) return;

        this.moveTowardCharacter(distance);
    }

    /**
     * Returns whether the chicken may currently move.
     * @returns {boolean} True when alive, unpaused, and not stomp-reacting.
     */
    canUpdateChickenMovement() {
        if (this.isDeadChicken || isPaused || !world) return false;
        return !this.isStompReacting;
    }

    /**
     * Returns the horizontal distance between Pepe and this chicken.
     * @returns {number} Negative when Pepe stands left of the chicken.
     */
    getCharacterDistance() {
        let chickenCenter = this.x + this.width / 2;
        let pepeCenter = world.character.x + world.character.width / 2;
        return pepeCenter - chickenCenter;
    }

    /**
     * Moves the chicken toward Pepe and faces the walking direction.
     * @param {number} distance The signed horizontal distance to Pepe.
     */
    moveTowardCharacter(distance) {
        if (distance < 0) {
            this.moveLeft();
            if (Math.abs(distance) >= 50) this.otherDirection = false;
        } else {
            this.moveRight();
            if (Math.abs(distance) >= 50) this.otherDirection = true;
        }
    }

    /** Runs movement and sprite animation timers. */
    animate() {
        this.walkInterval = setInterval(() => {
            this.updateChickenMovement();
        }, 1000 / 60);

        this.animationInterval = setInterval(() => {
            if (isPaused) return;
            if (!this.isDeadChicken) {
                this.playAnimation(this.IMAGES_WALKING);
            }
        }, 200);
    }

    /** Plays a brief squishing reaction when jumped on. */
    showStompReaction() {
        if (this.isDeadChicken || this.isStompReacting) return;

        this.isStompReacting = true;
        this.applyStompedSize();
        this.scheduleStompReset();
    }

    /** Applies the squished sprite size and position. */
    applyStompedSize() {
        this.height = this.stompedHeight;
        this.y = this.stompedY;
    }

    /** Restores the normal sprite size after the stomp reaction. */
    scheduleStompReset() {
        setTimeout(() => this.resetStompReaction(), 120);
    }

    /** Restores normal size unless the chicken died during the reaction. */
    resetStompReaction() {
        if (!this.isDeadChicken) {
            this.height = this.normalHeight;
            this.y = this.normalY;
        }
        this.isStompReacting = false;
    }

    /** Kills chicken and stops its animation timers. */
    die() {
        this.isDeadChicken = true;
        this.loadImage(this.IMAGE_DEAD);
        clearInterval(this.walkInterval);
        clearInterval(this.animationInterval);
    }

    /**
     * Returns whether the chicken has died.
     * @returns {boolean} True if the chicken is dead.
     */
    isDead() {
        return this.isDeadChicken;
    }
}