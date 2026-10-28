/**
 * Handles landing behavior when touching the ground.
 */
Character.prototype.handleGroundContact = function () {
    let wasFalling = this.speedY < 0;
    MovableObject.prototype.handleGroundContact.call(this);
    
    if (wasFalling) {
        this.lastLandingTime = Date.now();
    }
};

/**
 * Starts the movement and animation processing intervals.
 */
Character.prototype.animate = function () {
    setInterval(() => this.processMovement(), 1000 / 60);
    setInterval(() => this.processAnimations(), 150);
};

/**
 * Processes walking and jumping key inputs.
 * @returns {boolean} True if the character is moving horizontally.
 */
Character.prototype.handleWalkAndJump = function () {
    let movedRight = this.walkRight();
    let movedLeft = this.walkLeft();
    
    if (this.world.keyboard.SPACE && !this.isAboveGround()) {
        this.jump();
        return true;
    }
    return movedRight || movedLeft;
};

/**
 * Updates coordinates and direction when the right movement key is pressed.
 * @returns {boolean} True if moved to the right.
 */
Character.prototype.walkRight = function () {
    if (!this.world.keyboard.RIGHT) return false;
    if (this.x >= this.world.level.level_end_x) return false;
    this.moveRight();
    this.otherDirection = false;
    return true;
};

/**
 * Updates coordinates and direction when the left movement key is pressed.
 * @returns {boolean} True if moved to the left.
 */
Character.prototype.walkLeft = function () {
    if (!this.world.keyboard.LEFT || this.x <= 0) return false;
    this.moveLeft();
    this.otherDirection = true;
    return true;
};

/**
 * Calculates the target camera X coordinate based on the screen center.
 * @param {number} screenWidth The canvas screen width.
 * @returns {number} The target camera coordinate to scroll to.
 */
Character.prototype.calculateTargetCameraX = function (screenWidth) {
    let pepeCenter = this.x + this.offset.left + (this.width - this.offset.left - this.offset.right) / 2;
    let targetPosition = this.otherDirection ? screenWidth * 0.85 : screenWidth * 0.15;
    let targetCameraX = targetPosition - pepeCenter;
    let maxScroll = Math.max(0, this.world.level.level_end_x + this.width - screenWidth);
    
    return Math.max(-maxScroll, Math.min(0, targetCameraX));
};

/**
 * Smoothly moves the camera according to the character's position and direction.
 */
Character.prototype.updateCameraPosition = function () {
    let targetCameraX = this.calculateTargetCameraX(this.world.canvas.width);
    this.world.camera_x += (targetCameraX - this.world.camera_x) * 0.08;
};

/**
 * Sequentially updates the animation frames played upon death.
 */
Character.prototype.playDeathAnimation = function () {
    let idx = Math.min(this.deadFrameIndex, this.IMAGES_DEAD.length - 1);
    this.img = this.imageCache[this.IMAGES_DEAD[idx]];
    if (this.deadFrameIndex < this.IMAGES_DEAD.length - 1) {
        this.deadFrameIndex++;
    }
};

/**
 * Processes walking or standing animations while on the ground.
 */
Character.prototype.handleGroundState = function () {
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
};

/**
 * Plays the default idle or snoring animation when there is no input.
 */
Character.prototype.handleIdleAnimation = function () {
    let timePassed = (new Date().getTime() - this.lastActionTime) / 1000;
    if (timePassed > 4) {
        this.playAnimation(this.IMAGES_LONG_IDLE);
        if (typeof AUDIO_HUB !== 'undefined' && AUDIO_HUB.pepeSnore?.paused) {
            playSound(AUDIO_HUB.pepeSnore);
        }
    } else {
        this.playAnimation(this.IMAGES_IDLE);
    }
};

/**
 * Makes the character jump upwards and plays the sound.
 */
Character.prototype.jump = function () {
    this.speedY = 30;
    if (typeof playSound === 'function' && typeof AUDIO_HUB !== 'undefined') {
        playSound(AUDIO_HUB.jump);
    }
};

/**
 * Periodically checks keyboard input to update the character's coordinates.
 */
Character.prototype.processMovement = function () {
    if (!this.world || this.isDead() || isPaused) return;
    let isMoving = this.handleWalkAndJump();
    
    if (isMoving || this.world.keyboard.D) {
        this.resetIdleTimer();
    }
    this.updateCameraPosition();
};

/**
 * Assigns the appropriate sprite based on the character's current state.
 */
Character.prototype.processAnimations = function () {
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
};

/**
 * Resets the idle state and stops the snoring sound when user action is detected.
 */
Character.prototype.resetIdleTimer = function () {
    this.lastActionTime = new Date().getTime();
    if (typeof AUDIO_HUB !== 'undefined' && AUDIO_HUB.pepeSnore && !AUDIO_HUB.pepeSnore.paused) {
        AUDIO_HUB.pepeSnore.pause();
        AUDIO_HUB.pepeSnore.currentTime = 0;
    }
};