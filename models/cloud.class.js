/**
 * Represents a slowly moving background cloud.
 * @extends MovableObject
 */
class Cloud extends MovableObject {
    y = 30;
    width = 500;
    height = 250;

    /**
     * Creates a cloud at a random horizontal position.
     */
    constructor() {
        super();
        this.loadImage('img/5_background/layers/4_clouds/1.png');
        this.x = Math.random() * 500;
        this.animate();
    }

    /**
     * Starts continuous cloud movement.
     */
    animate() {
        this.moveLeft();
    }
}