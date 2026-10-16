class World {
    character = new Character();
    level;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar();
    statusBarBottle = new StatusBarBottle();
    statusBarEndboss = new StatusBarEndboss();
    throwableObjects = [];
    canThrow = true;
    availableBottles = 0;
    maxBottles = 5;

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
        }, 50);
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

            // 투척 후 상태바 갱신 (예: 1개 던져서 줄어듦)
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
        this.level.enemies.forEach((enemy, enemyIndex) => {
            // isDead() 함수로 생존 여부 확인
            let isEnemyAlive = typeof enemy.isDead === 'function' ? !enemy.isDead() : !enemy.isDead;

            if (isEnemyAlive && this.character.isColliding(enemy)) {
                // 1) 보스에게 부딪혔을 때: 무조건 페페 피격!
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

                // 이미 터진 병(!bottle.isSplashed)은 다시 맞지 않도록 방어
                if (isEnemyAlive && !bottle.isSplashed && bottle.isColliding(enemy)) {
                    bottle.isSplashed = true; // 즉시 플래그를 세워 연속 피격 방지

                    if (typeof bottle.splash === 'function') {
                        bottle.splash();
                    }

                    if (enemy instanceof Endboss) {
                        // 보스가 무적(피격) 시간이 아닐 때만 1회 타격 인정
                        if (!enemy.isHurt()) {
                            enemy.hit();
                            this.statusBarEndboss.setPercentage(enemy.energy);
                            console.log('>>> 보스 정상 타격! 남은 체력:', enemy.energy);
                        }
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

                    // 맞은 병 제거
                    setTimeout(() => {
                        let bIdx = this.throwableObjects.indexOf(bottle);
                        if (bIdx > -1) {
                            this.throwableObjects.splice(bIdx, 1);
                        }
                    }, 100);
                }
            });
        });

        // [3] 바닥 병 수집
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
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.translate(this.camera_x, 0);

        this.addObjectsToMap(this.level.backgroundObjects);
        this.addToMap(this.character);
        this.addObjectsToMap(this.level.clouds);

        if (this.level.bottles) {
            this.addObjectsToMap(this.level.bottles);
        }

        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.throwableObjects);

        this.ctx.translate(-this.camera_x, 0);

        // 고정 UI 그리기
        this.addToMap(this.statusBar);
        this.addToMap(this.statusBarBottle);

        // 보스와 조우했을 때만 보스 체력바 표시
        let endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (endboss && endboss.hadFirstContact) {
            this.addToMap(this.statusBarEndboss);
        }

        let self = this;
        requestAnimationFrame(function() {
            self.draw();
        });
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

        // if (mo.drawFrame) {
        //     mo.drawFrame(this.ctx);
        // }

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