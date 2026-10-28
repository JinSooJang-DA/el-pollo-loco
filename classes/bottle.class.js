/**
 * Represents a salsa bottle collectible on the ground.
 * @extends MovableObject
 */
class Bottle extends MovableObject {
    height = 70;
    width = 60;
    y = 350;

    offset = {
        top: 10,
        bottom: 10,
        left: 15,
        right: 15
    };

    IMAGES = [
        'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
        'img/6_salsa_bottle/2_salsa_bottle_on_ground.png'
    ];

    /**
     * Creates a collectible bottle placed on the ground.
     * @param {number} [x] - Horizontal coordinate for the bottle.
     */
    constructor(x) {
        super();
        let randomImg = this.IMAGES[Math.floor(Math.random() * this.IMAGES.length)];
        this.loadImage(randomImg);
        this.loadImages(this.IMAGES);
        this.x = x !== undefined ? x : 300 + Math.random() * 1500;
    }
}