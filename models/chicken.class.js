class Chicken extends MovableObject {
    height = 50;
    width = 65;
    y = 370;
    isDead = false;
    walkInterval;
    animationInterval;

    offset = {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
    };

    IMAGES_WALKING = [
        'img/3_enemies_chicken/chicken_normal/1_walk/1_w.png',
        'img/3_enemies_chicken/chicken_normal/1_walk/2_w.png',
        'img/3_enemies_chicken/chicken_normal/1_walk/3_w.png'
    ];

    // 정확한 파일명인 dead.png로 지정
    IMAGE_DEAD = 'img/3_enemies_chicken/chicken_normal/2_dead/dead.png';

    constructor(x) {
        super().loadImage('img/3_enemies_chicken/chicken_normal/1_walk/1_w.png');
        this.loadImages(this.IMAGES_WALKING);

        if (x !== undefined) {
            this.x = x;
        } else {
            this.x = 600 + Math.random() * 1200;
        }

        this.speed = 0.15 + Math.random() * 0.5;
        this.animate();
    }

    animate() {
        this.walkInterval = setInterval(() => {
            if (!this.isDead) {
                this.moveLeft();
            }
        }, 1000 / 60);

        this.animationInterval = setInterval(() => {
            if (!this.isDead) {
                this.playAnimation(this.IMAGES_WALKING);
            }
        }, 200);
    }

    die() {
        this.isDead = true;
        this.loadImage(this.IMAGE_DEAD); // dead.png 이미지로 교체
        clearInterval(this.walkInterval); // 이동 중지
        clearInterval(this.animationInterval); // 걷기 애니메이션 중지
    }
}