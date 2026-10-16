class ThrowableObject extends MovableObject {
    otherDirection = false;

    // 1. 회전 애니메이션 이미지 배열 선언
    IMAGES_ROTATING = [
        'img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
        'img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
        'img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
        'img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png'
    ];

    constructor(x, y, otherDirection) {
        super().loadImage(this.IMAGES_ROTATING[0]);
        this.loadImages(this.IMAGES_ROTATING); // 이미지 캐시 프리로드
        this.x = x;
        this.y = y;
        this.otherDirection = otherDirection;
        this.height = 60;
        this.width = 50;
        this.throw();
        this.animate(); // 애니메이션 루프 실행
    }

    throw() {
        this.speedY = 30;
        this.applyGravity();
        setInterval(() => {
            if (this.otherDirection) {
                this.x -= 10;
            } else {
                this.x += 10;
            }
        }, 25);
    }

    // 2. 날아가는 동안 60ms 간격으로 빙글빙글 도는 모션 재생
    animate() {
        setInterval(() => {
            this.playAnimation(this.IMAGES_ROTATING);
        }, 60);
    }

    isAboveGround() {
        return true;
    }
}