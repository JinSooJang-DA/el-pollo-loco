/**
 * Represents a static layered background image tile.
 * @extends MovableObject
 */
class BackgroundObject extends MovableObject {
    width = 720;
    height = 480;

    /**
     * Creates a background tile layer.
     * @param {string} imagePath - File path to background layer image.
     * @param {number} x - Horizontal position.
     */
    constructor(imagePath, x) {
        super().loadImage(imagePath);
        this.x = x;
        this.y = 480 - this.height;
    }
}