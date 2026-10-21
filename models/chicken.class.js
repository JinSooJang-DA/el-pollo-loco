
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

    /** Runs movement and sprite animation timers. */

    animate() {
        this.walkInterval = setInterval(() => {
            if (this.isDeadChicken || isPaused || !world) return;

            // Stop moving during the stomp reaction.
            if (this.isStompReacting) return;

            // Compare the center positions.
            let chickenCenter = this.x + this.width / 2;
            let pepeCenter = world.character.x +
                world.character.width / 2;

            let distance = pepeCenter - chickenCenter;

            // Stop only after the collision boxes actually touch.
            if (this.isColliding(world.character)) return;

            if (distance < 0) {
                this.moveLeft();
                if (Math.abs(distance) >= 50) {
                    this.otherDirection = false;
                }
            } else {
                this.moveRight();
                if (Math.abs(distance) >= 50) {
                    this.otherDirection = true;
                }
            }
        }, 1000 / 60);

        this.animationInterval = setInterval(() => {
            if (!this.isDeadChicken) {
                this.playAnimation(this.IMAGES_WALKING);
            }
        }, 200);
    }


    showStompReaction() {
        if (this.isDeadChicken || this.isStompReacting) return;

        this.isStompReacting = true;
        this.height = this.stompedHeight;
        this.y = this.stompedY;

        setTimeout(() => {
            if (!this.isDeadChicken) {
                this.height = this.normalHeight;
                this.y = this.normalY;
            }
            this.isStompReacting = false;
        }, 120);
    }

    /** Kills chicken and stops its animation timers. */
    die() {
        this.isDeadChicken = true;
        this.loadImage(this.IMAGE_DEAD);
        clearInterval(this.walkInterval);
        clearInterval(this.animationInterval);
    }

    /** Returns whether the chicken has died. */
    isDead() {
        return this.isDeadChicken;
    }
}
