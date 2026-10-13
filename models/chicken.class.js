class Chicken extends MovableObject {
    y = 360;
    height = 50;
    width = 65;
    constructor() {
        super();
        this.loadImage('img/3_enemies_chicken/chicken_normal/1_walk/1_w.png');
        this.x = 200 + Math.random() * 500;
    }


}