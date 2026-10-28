/**
 * Represents a floating collectible coin.
 * @extends MovableObject
 */
class Coin extends MovableObject {
    width = 30;
    height = 30;

    offset = {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
    };

    IMAGES = [
        'img/coin-full.webp',
        'img/coin-side.webp'
    ];

    /**
     * Creates a coin with an animated pulse loop.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     */
    constructor(x, y) {
        super().loadImage(this.IMAGES[0]);
        this.loadImages(this.IMAGES);
        this.x = x;
        this.y = y;
        this.animate();
    }

    /**
     * Runs periodic coin frame animation.
     */
    animate() {
        setInterval(() => {
            if (isPaused) return;
            this.playAnimation(this.IMAGES);
        }, 300);
    }
}
