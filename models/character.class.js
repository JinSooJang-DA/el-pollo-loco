/**
 * Represents the main playable character (Pepe).
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
        'img/2_character_pepe/5_dead/D-56.png'
    ];

    DEAD_FRAME_ALPHA_BOUNDS = [
        { left: 69, top: 495, right: 546, bottom: 1200 },
        { left: 48, top: 466, right: 561, bottom: 1200 },
        { left: 55, top: 491, right: 567, bottom: 1141 },
        { left: 55, top: 421, right: 567, bottom: 1141 },
        { left: 55, top: 337, right: 567, bottom: 1141 },
        { left: 55, top: 301, right: 567, bottom: 1141 }
    ];

    DEAD_FRAME_RENDER_Y = [0, 0, -8, -24, -36, 0];

    /**
     * Loads initial images and starts gravity and animations.
     */
    constructor() {
        super();
        this.loadImage('img/2_character_pepe/2_walk/W-21.png');
        this.loadCharacterImages();
        this.applyGravity();
        this.animate();
    }

    /**
     * Loads all state-specific image arrays into the cache.
     */
    loadCharacterImages() {
        [this.IMAGES_IDLE, this.IMAGES_LONG_IDLE, this.IMAGES_WALKING,
         this.IMAGES_JUMPING, this.IMAGES_HURT, this.IMAGES_DEAD]
         .forEach(images => this.loadImages(images));
    }

    /**
     * Performs standard rendering when alive, and special rendering when dead.
     * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
     */
    draw(ctx) {
        if (!this.isDead()) {
            super.draw(ctx);
            return;
        }
        this.drawDeadFrame(ctx);
    }

    /**
     * Draws the death animation frame applying rotation and offsets.
     * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
     */
    drawDeadFrame(ctx) {
        let frameIndex = this.IMAGES_DEAD.findIndex(path => this.imageCache[path] === this.img);
        let rotation = this.getDeathRotation(frameIndex);
        let floorOffset = this.getDeathFloorOffset(frameIndex, rotation);
        let visualOffset = this.getDeathVisualOffset(frameIndex);
        let edgeOffset = this.getDeathEdgeOffset(frameIndex);
        
        ctx.save();
        ctx.translate(this.x + this.width / 2 + edgeOffset, this.y + this.height + floorOffset + visualOffset);
        ctx.rotate(rotation);
        ctx.drawImage(this.img, -this.width / 2, -this.height, this.width, this.height);
        ctx.restore();
    }

    /**
     * Returns the screen rotation angle per frame.
     * @param {number} frameIndex The current death frame index.
     * @returns {number} The rotation value in radians.
     */
    getDeathRotation(frameIndex) {
        let rotations = [0, 0, 0, 0, -Math.PI / 6, -Math.PI / 2];
        return rotations[frameIndex] || 0;
    }

    /**
     * Returns the visual height offset exclusively for rendering.
     * @param {number} frameIndex The current death frame index.
     * @returns {number} The Y-axis pixel offset.
     */
    getDeathVisualOffset(frameIndex) {
        return this.DEAD_FRAME_RENDER_Y[frameIndex] || 0;
    }

    /**
     * Returns the correction value to keep the death sprite within the canvas.
     * @param {number} frameIndex The current death frame index.
     * @returns {number} The offset for screen position correction.
     */
    getDeathEdgeOffset(frameIndex) {
        if (!this.world?.canvas || frameIndex < 0) return 0;
        let targetScreenOffset = this.getDeathScreenCorrection();

        let progress = [0, 0, 0.2, 0.45, 0.75, 1][frameIndex] || 0;
        let localOffset = targetScreenOffset * progress;

        return this.otherDirection ? -localOffset : localOffset;
    }

    /**
     * Calculates how far the whole death animation must shift to stay visible.
     * @returns {number} The screen-space correction in pixels.
     */
    getDeathScreenCorrection() {
        let allBounds = this.IMAGES_DEAD.map((_, i) => this.getDeathScreenBounds(i, this.getDeathRotation(i)));

        let animLeft = Math.min(...allBounds.map(b => b.left));
        let animRight = Math.max(...allBounds.map(b => b.right));

        return this.getCanvasBoundsCorrection(animLeft, animRight);
    }

    /**
     * Returns the shift needed to keep the animation inside the canvas margins.
     * @param {number} animLeft The leftmost animation bound.
     * @param {number} animRight The rightmost animation bound.
     * @returns {number} The screen offset in pixels.
     */
    getCanvasBoundsCorrection(animLeft, animRight) {
        let margin = 8;

        if (animLeft < margin) return margin - animLeft;
        if (animRight > this.world.canvas.width - margin) {
            return this.world.canvas.width - margin - animRight;
        }

        return 0;
    }

    /**
     * Calculates the screen corner coordinates with rotation applied.
     * @param {Object} bounds The bounding box excluding transparency.
     * @param {number} rotation The rotation value in radians.
     * @returns {number[]} The array of canvas screen X coordinates.
     */
    calculateScreenVertices(bounds, rotation) {
        let scaleX = this.width / 610, scaleY = this.height / 1200;
        let xVals = [bounds.left * scaleX - this.width / 2, bounds.right * scaleX - this.width / 2];
        let yVals = [bounds.top * scaleY - this.height, bounds.bottom * scaleY - this.height];
        let cos = Math.cos(rotation), sin = Math.sin(rotation);
        let mirror = this.otherDirection ? -1 : 1;
        let worldX = this.otherDirection ? -this.x : this.x;
        let pivotX = worldX + this.width / 2 + (this.world?.camera_x || 0);
        
        return xVals.flatMap(x => yVals.map(y => pivotX + mirror * (cos * x - sin * y)));
    }

    /**
     * Returns the left and right endpoints of the visible death sprite on screen.
     * @param {number} frameIndex The current death frame index.
     * @param {number} rotation The rotation value in radians.
     * @returns {Object} An object containing the min (left) and max (right) screen coordinates.
     */
    getDeathScreenBounds(frameIndex, rotation) {
        let bounds = this.DEAD_FRAME_ALPHA_BOUNDS[frameIndex];
        if (!bounds) return { left: 0, right: 0 };
        
        let screenX = this.calculateScreenVertices(bounds, rotation);
        return { left: Math.min(...screenX), right: Math.max(...screenX) };
    }

    /**
     * Calculates the Y offset touching the floor, ignoring transparency.
     * @param {number} frameIndex The current death frame index.
     * @param {number} rotation The rotation value in radians.
     * @returns {number} The offset for floor correction.
     */
    getDeathFloorOffset(frameIndex, rotation) {
        let bounds = this.DEAD_FRAME_ALPHA_BOUNDS[frameIndex];
        if (!bounds) return 0;
        
        let scaleX = this.width / 610, scaleY = this.height / 1200;
        let sin = Math.sin(rotation), cos = Math.cos(rotation);
        let xValues = [bounds.left * scaleX - this.width / 2, bounds.right * scaleX - this.width / 2];
        let yValues = [bounds.top * scaleY - this.height, bounds.bottom * scaleY - this.height];
        let lowestPixel = Math.max(...xValues.flatMap(x => yValues.map(y => sin * x + cos * y)));
        
        return Math.min(0, -lowestPixel);
    }
}