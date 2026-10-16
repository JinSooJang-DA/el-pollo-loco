class Endboss extends MovableObject {
    height = 400;
    width = 250;
    y = 55;
    speed = 2.5;
    energy = 100;
    hadFirstContact = false;

    offset = {
        top: 60,
        bottom: 20,
        left: 30,
        right: 30
    };

    IMAGES_ALERT = [
        'img/4_enemie_boss_chicken/2_alert/G6.png',
        'img/4_enemie_boss_chicken/2_alert/G7.png',
        'img/4_enemie_boss_chicken/2_alert/G8.png',
        'img/4_enemie_boss_chicken/2_alert/G9.png',
        'img/4_enemie_boss_chicken/2_alert/G10.png',
        'img/4_enemie_boss_chicken/2_alert/G11.png',
        'img/4_enemie_boss_chicken/2_alert/G12.png'
    ];

    IMAGES_ATTACK = [
        'img/4_enemie_boss_chicken/3_attack/G13.png',
        'img/4_enemie_boss_chicken/3_attack/G14.png',
        'img/4_enemie_boss_chicken/3_attack/G15.png',
        'img/4_enemie_boss_chicken/3_attack/G16.png',
        'img/4_enemie_boss_chicken/3_attack/G17.png',
        'img/4_enemie_boss_chicken/3_attack/G18.png',
        'img/4_enemie_boss_chicken/3_attack/G19.png',
        'img/4_enemie_boss_chicken/3_attack/G20.png'
    ];

    IMAGES_HURT = [
        'img/4_enemie_boss_chicken/4_hurt/G21.png',
        'img/4_enemie_boss_chicken/4_hurt/G22.png',
        'img/4_enemie_boss_chicken/4_hurt/G23.png'
    ];

    IMAGES_DEAD = [
        'img/4_enemie_boss_chicken/5_dead/G24.png',
        'img/4_enemie_boss_chicken/5_dead/G25.png',
        'img/4_enemie_boss_chicken/5_dead/G26.png'
    ];

    constructor() {
        super().loadImage(this.IMAGES_ALERT[0]);
        this.loadImages(this.IMAGES_ALERT);
        this.loadImages(this.IMAGES_ATTACK);
        this.loadImages(this.IMAGES_HURT);
        this.loadImages(this.IMAGES_DEAD);
        this.x = 2000;
        this.animate();
    }

    // 4번에 죽도록 1회당 데미지 25 차감
    hit() {
        this.energy -= 25;
        if (this.energy < 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime();
        }
    }

    animate() {
        let i = 0;
        let deadInterval;
        let mainInterval = setInterval(() => {
            // 1. 사망했을 때: 일반 동작 인터벌을 즉시 멈추고 사망 전용 연출 시작
            if (this.isDead()) {
                clearInterval(mainInterval); // 이동 및 공격 완전 중단

                let deadFrame = 0;
                deadInterval = setInterval(() => {
                    if (deadFrame < this.IMAGES_DEAD.length) {
                        this.img = this.imageCache[this.IMAGES_DEAD[deadFrame]];
                        deadFrame++;
                    } else {
                        clearInterval(deadInterval); // 3장 재생 완료

                        // 3장이 다 나오고 통구이가 된 상태로 아래로 낙하
                        let fallInterval = setInterval(() => {
                            this.y += 15;
                            if (this.y > 600) {
                                clearInterval(fallInterval);
                                this.deathAnimationFinished = true; // [핵심] 퇴장 완료 플래그!
                            }
                        }, 1000 / 30);
                    }
                }, 200); // 0.2초마다 사망 프레임 전환 (충분히 눈으로 보임)
            } 
            // 2. 피격 중일 때 (사망이 아닐 때만)
            else if (this.isHurt()) {
                this.playAnimation(this.IMAGES_HURT);
            } 
            // 3. 첫 등장 경계
            else if (i < 10) {
                this.playAnimation(this.IMAGES_ALERT);
            } 
            // 4. 일반 이동/공격
            else {
                this.playAnimation(this.IMAGES_ATTACK);
                this.moveLeft();
            }
            i++;

            // 조우 플래그
            if (world && !this.hadFirstContact) {
                let distance = Math.abs(this.x - world.character.x);
                if (world.character.x > 1600 || distance < 600) {
                    i = 0;
                    this.hadFirstContact = true;
                }
            }
        }, 150);
    }
}