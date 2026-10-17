/**
 * Base class for all movable entities featuring physics, collision, and animation.
 * @extends DrawableObject
 */
class MovableObject extends DrawableObject {
    speed = 0.15;
    otherDirection = false;
    speedY = 0;
    acceleration = 2.5;
    energy = 100;
    lastHit = 0;

    offset = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    };

    /**
     * Applies gravity pull downward when object is airborne.
     */
    applyGravity() {
        setInterval(() => {
            if (this.isAboveGround() || this.speedY > 0) {
                this.y -= this.speedY;
                this.speedY -= this.acceleration;
            } else {
                this.handleGroundContact();
            }
        }, 1000 / 25);
    }

    /**
     * Fixes object on standard floor level when landing.
     */
    handleGroundContact() {
        if (!(this instanceof ThrowableObject)) {
            this.y = 150;
            this.speedY = 0;
        }
    }

    /**
     * Checks if the entity is elevated above ground.
     * @returns {boolean} True if airborne.
     */
    isAboveGround() {
        if (this instanceof ThrowableObject) {
            return true;
        }
        return this.y < 150;
    }

    /**
     * Evaluates rectangular bounding box collision with offsets considered.
     * @param {MovableObject} mo - Target object to check overlap against.
     * @returns {boolean} True if colliding.
     */
    isColliding(mo) {
        return this.x + this.width - this.offset.right > mo.x + mo.offset.left &&
            this.y + this.height - this.offset.bottom > mo.y + mo.offset.top &&
            this.x + this.offset.left < mo.x + mo.width - mo.offset.right &&
            this.y + this.offset.top < mo.y + mo.height - mo.offset.bottom;
    }

    /**
     * Deducts health energy and records hit timestamp.
     */
    hit() {
        this.energy -= 20;
        if (this.energy <= 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime(); // 피격 시점 기록 (필수!)
        }
    }

    /**
     * Checks if object is currently within invulnerability/hurt grace period.
     * @returns {boolean} True if recently hurt.
     */
    isHurt() {
        let timepassed = new Date().getTime() - this.lastHit;
        timepassed = timepassed / 1000; // 초 단위로 변환
        return timepassed < 1; // 1초 동안은 다시 다치지 않음 (무적 시간)
    }

    /**
     * Checks if object energy is depleted.
     * @returns {boolean} True if dead.
     */
    isDead() {
        return this.energy <= 0;
    }

    /**
     * Cycles through a set of sprite images sequentially.
     * @param {string[]} images - Array of image paths.
     */
    playAnimation(images) {
        let i = this.currentImage % images.length;
        let path = images[i];
        this.img = this.imageCache[path];
        this.currentImage++;
    }

    /**
     * Moves object to the right by its speed value.
     */
    moveRight() {
        this.x += this.speed;
    }

    /**
     * Moves object to the left by its speed value.
     */
    moveLeft() {
        this.x -= this.speed;
    }

    /**
     * Gives entity upward initial jump velocity.
     */
    jump() {
        this.speedY = 30;
    }
}