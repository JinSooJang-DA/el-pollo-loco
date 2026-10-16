class Endboss extends MovableObject {
    height = 400;
    width = 250;
    y = 55;
    speed = 2.5;
    energy = 100;
    hadFirstContact = false;

    // 히트박스 여백 설정
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

    animate() {
        let i = 0;
        let deadInterval;
        let mainInterval = setInterval(() => {
            if (this.isDead()) {
                clearInterval(mainInterval);

                let deadIndex = 0;
                deadInterval = setInterval(() => {
                    if (deadIndex < this.IMAGES_DEAD.length) {
                        this.img = this.imageCache[this.IMAGES_DEAD[deadIndex]];
                        deadIndex++;
                    } else {
                        clearInterval(deadInterval);
                        
                        // 통구이가 된 후 화면 아래로 툭 떨어지는 연출
                        setInterval(() => {
                            this.y += 15;
                        }, 1000 / 25);

                        // 1.5초 후 게임 승리(Game Over / Won) 처리
                        setTimeout(() => {
                            // TODO: 승리 엔딩 화면 호출 (예: showGameOverScreen(true))
                            console.log('게임 승리!');
                        }, 1500);
                    }
                }, 150);

            } else if (this.isHurt()) {
                this.playAnimation(this.IMAGES_HURT);
            } else if (i < 10) {
                this.playAnimation(this.IMAGES_ALERT);
            } else {
                this.playAnimation(this.IMAGES_ATTACK);
                this.moveLeft();
            }
            i++;

            if (world && world.character.x > 1600 && !this.hadFirstContact) {
                i = 0;
                this.hadFirstContact = true;
            }
        }, 150);
    }

    // 보스 피격 메서드
    hit() {
        this.energy -= 25; // 4방에 사망 (100 -> 75 -> 50 -> 25 -> 0)
        if (this.energy < 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime();
        }
    }
}