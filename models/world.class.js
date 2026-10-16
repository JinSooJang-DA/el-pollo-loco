class World {
    character = new Character();
    level;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar();
    statusBarBottle = new StatusBarBottle();
    statusBarCoin = new StatusBarCoin();
    statusBarEndboss = new StatusBarEndboss();
    throwableObjects = [];
    canThrow = true;
    availableBottles = 0;
    maxBottles = 5;
    collectedCoins = 0;
    maxCoins = 5;
    gameEnded = false; // 게임 종료 상태 플래그

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.level = level1; // level1 인스턴스 직접 할당
        this.setWorld();
        this.draw();
        this.run();
    }

    setWorld() {
        this.character.world = this;
    }

    run() {
        setInterval(() => {
            this.checkCollisions();
            this.checkThrowObjects();
            this.checkGameOver();
        }, 50);
    }

    showEndScreen(imagePath) {
        for (let i = 1; i < 9999; i++) {
            window.clearInterval(i);
        }

        let endImg = new Image();
        endImg.src = imagePath;
        endImg.onload = () => {
            // 1. 전체 화면을 깔끔한 어두운 배경으로 덮기
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // 뒷배경이 살짝 보이는 반투명 블랙 (완전 검정은 '#000000')
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // 2. 원본 가로세로 비율을 유지하며 중앙 배치 계산
            let targetWidth = 500; // 원하는 글자 너비
            let aspectRatio = endImg.naturalHeight / endImg.naturalWidth;
            let targetHeight = targetWidth * aspectRatio; // 원래 비율대로 높이 계산

            let x = (this.canvas.width - targetWidth) / 2;
            let y = (this.canvas.height - targetHeight) / 2;

            // 3. 중앙에 예쁘게 그리기
            this.ctx.drawImage(endImg, x, y, targetWidth, targetHeight);

            let restartBtn = document.getElementById('restartBtnContainer');
            if (restartBtn) {
                restartBtn.classList.remove('d-none');
            }
        };
    }

    checkThrowObjects() {
        if (this.keyboard.D && this.canThrow && this.availableBottles > 0) {
            let xOffset = this.character.otherDirection ? 0 : 60;
            let bottle = new ThrowableObject(
                this.character.x + xOffset,
                this.character.y + 140,
                this.character.otherDirection
            );
            this.throwableObjects.push(bottle);
            this.availableBottles--;

            // 투척 후 상태바 갱신
            let percentage = (this.availableBottles / this.maxBottles) * 100;
            this.statusBarBottle.setPercentage(percentage);

            this.canThrow = false;
            setTimeout(() => {
                this.canThrow = true;
            }, 1000);
        }
    }

    checkCollisions() {
        // [1] 페페와 적(보스, 일반 닭) 충돌 검사
        this.level.enemies.forEach((enemy) => {
            let isEnemyAlive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;

            if (isEnemyAlive && this.character.isColliding(enemy)) {
                // 1) 보스에게 부딪혔을 때: 무조건 페페 피격
                if (enemy instanceof Endboss) {
                    if (!this.character.isHurt()) {
                        console.log('>>> [성공] 보스에게 페페 피격!');
                        this.character.hit();
                        this.statusBar.setPercentage(this.character.energy);
                    }
                }
                // 2) 일반 닭에게 부딪혔을 때
                else {
                    let isFalling = this.character.speedY < 0 || this.character.isAboveGround();

                    if (isFalling) {
                        if (typeof enemy.die === 'function') {
                            enemy.die();
                        }
                        this.character.speedY = 15;
                        setTimeout(() => {
                            let idx = this.level.enemies.indexOf(enemy);
                            if (idx > -1) {
                                this.level.enemies.splice(idx, 1);
                            }
                        }, 500);
                    } else if (!this.character.isHurt()) {
                        this.character.hit();
                        this.statusBar.setPercentage(this.character.energy);
                    }
                }
            }
        });

        // [2] 던진 병과 적(보스, 일반 닭) 충돌 검사
        this.throwableObjects.forEach((bottle) => {
            this.level.enemies.forEach((enemy) => {
                let isEnemyAlive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;

                // 터지지 않은 병이 살아있는 적과 부딪혔을 때
                if (isEnemyAlive && !bottle.isSplashed && bottle.isColliding(enemy)) {
                    bottle.isSplashed = true; // 다중 타격 방지

                    if (typeof bottle.splash === 'function') {
                        bottle.splash();
                    }

                    if (enemy instanceof Endboss) {
                        enemy.hadFirstContact = true;
                        
                        // [수정] 무적 검사를 풀고 병이 맞으면 무조건 1회 타격 반영
                        enemy.hit();
                        this.statusBarEndboss.setPercentage(enemy.energy);
                        console.log('>>> [타격 성공] 보스 잔여 체력:', enemy.energy);

                    } else if (enemy instanceof Chicken) {
                        if (typeof enemy.die === 'function') {
                            enemy.die();
                        }
                        setTimeout(() => {
                            let eIdx = this.level.enemies.indexOf(enemy);
                            if (eIdx > -1) {
                                this.level.enemies.splice(eIdx, 1);
                            }
                        }, 500);
                    }

                    // 맞은 병 삭제
                    setTimeout(() => {
                        let bIdx = this.throwableObjects.indexOf(bottle);
                        if (bIdx > -1) {
                            this.throwableObjects.splice(bIdx, 1);
                        }
                    }, 100);
                }
            });
        });

        // [3] 바닥 병 수집 검사
        if (this.level.bottles) {
            this.level.bottles.forEach((bottle, index) => {
                if (this.character.isColliding(bottle)) {
                    if (this.availableBottles < this.maxBottles) {
                        this.availableBottles++;
                        this.level.bottles.splice(index, 1);
                        let percentage = (this.availableBottles / this.maxBottles) * 100;
                        this.statusBarBottle.setPercentage(percentage);
                    }
                }
            });
        }

        // [4] 공중 동전 수집 검사
        if (this.level.coins) {
            this.level.coins.forEach((coin, index) => {
                if (this.character.isColliding(coin)) {
                    this.collectedCoins++;
                    this.level.coins.splice(index, 1);

                    let percentage = (this.collectedCoins / this.maxCoins) * 100;
                    this.statusBarCoin.setPercentage(percentage);
                    console.log('코인 수집! 현재 개수:', this.collectedCoins);
                }
            });
        }
    }

    draw() {
        // 게임이 종료되면 애니메이션 프레임 루프 정지
        if (this.gameEnded) {
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(this.camera_x, 0);

        this.addObjectsToMap(this.level.backgroundObjects);
        this.addToMap(this.character);
        this.addObjectsToMap(this.level.clouds);

        if (this.level.bottles) {
            this.addObjectsToMap(this.level.bottles);
        }

        if (this.level.coins) {
            this.addObjectsToMap(this.level.coins);
        }

        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.throwableObjects);

        this.ctx.translate(-this.camera_x, 0);

        // 고정 UI 상태바
        this.addToMap(this.statusBar);
        this.addToMap(this.statusBarBottle);
        this.addToMap(this.statusBarCoin);

        // 보스와 조우했을 때만 보스 체력바 표시
        let endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (endboss && endboss.hadFirstContact) {
            this.addToMap(this.statusBarEndboss);
        }

        let self = this;
        requestAnimationFrame(function () {
            self.draw();
        });
    }

    checkGameOver() {
        let endboss = this.level.enemies.find(e => e instanceof Endboss);

        // 1. 페페 사망 -> 게임 오버(패배)
        if (this.character.isDead() && !this.gameEnded) {
            this.gameEnded = true;
            setTimeout(() => {
                this.showEndScreen('img/9_intro_outro_screens/game_over/game over.png');
            }, 1000);
        }

        // 2. 보스 사망 연출 완료 -> 승리 화면 표시!
        if (endboss && endboss.deathAnimationFinished && !this.gameEnded) {
            this.gameEnded = true;
            this.showEndScreen('img/You won, you lost/You win B.png');
        }
    }

    addObjectsToMap(objects) {
        if (objects) {
            objects.forEach(o => {
                this.addToMap(o);
            });
        }
    }

    addToMap(mo) {
        if (mo.otherDirection) {
            this.flipImage(mo);
        }
        mo.draw(this.ctx);

        if (mo.otherDirection) {
            this.flipImageBack(mo);
        }
    }

    flipImage(mo) {
        this.ctx.save();
        this.ctx.translate(mo.width, 0);
        this.ctx.scale(-1, 1);
        mo.x = mo.x * -1;
    }

    flipImageBack(mo) {
        mo.x = mo.x * -1;
        this.ctx.restore();
    }
}