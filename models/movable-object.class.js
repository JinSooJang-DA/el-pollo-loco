class MovableObject extends DrawableObject {
    speed = 0.15;
    otherDirection = false;
    speedY = 0;
    acceleration = 2.5;
    energy = 100;


    applyGravity() {
        setInterval(() => {
            if (this.isAboveGround() || this.speedY > 0) {
                this.y -= this.speedY;
                this.speedY -= this.acceleration;
            }
        }, 1000 / 25);
    }

    isAboveGround() {
        return this.y < 140; // 또는 본인이 설정한 캐릭터 바닥 높이(180)
    }


    offset = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    };

    isColliding(mo) {
        return this.x + this.width - this.offset.right > mo.x + mo.offset.left &&
            this.y + this.height - this.offset.bottom > mo.y + mo.offset.top &&
            this.x + this.offset.left < mo.x + mo.width - mo.offset.right &&
            this.y + this.offset.top < mo.y + mo.height - mo.offset.bottom;
    }

    lastHit = 0; // 마지막 피격 시점 (타임스탬프)

    hit() {
        this.energy -= 5;
        if (this.energy < 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime(); // 맞은 시간 기록
        }
    }

    isHurt() {
        let timepassed = new Date().getTime() - this.lastHit; // 밀리초(ms) 단위 차이
        timepassed = timepassed / 1000; // 초(s) 단위 변환
        return timepassed < 1; // 
    }

    isDead() {
        return this.energy == 0;
    }




    playAnimation(images) {
        let i = this.currentImage % images.length;
        let path = images[i];
        this.img = this.imageCache[path];
        this.currentImage++;
    }

    moveRight() {
        this.x += this.speed;

    }
    moveLeft() {
        this.x -= this.speed;
    }

    jump() {
        this.speedY = 30;
    }
}