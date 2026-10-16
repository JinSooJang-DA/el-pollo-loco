/**
 * Represents a floating collectible coin.
 * @extends MovableObject
 */
class Coin extends MovableObject {
    width = 100;
    height = 100;

    offset = {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30
    };

    IMAGES = [
        'img/8_coin/coin_1.png',
        'img/8_coin/coin_2.png'
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
            this.playAnimation(this.IMAGES);
        }, 300);
    }
}