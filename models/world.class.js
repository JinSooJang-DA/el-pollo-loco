class World {
    character = new Character();
    level;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar();
    throwableObjects = [];
    canThrow = true;
    availableBottles = 0;

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

            this.canThrow = false;
            setTimeout(() => {
                this.canThrow = true;
            }, 1000);
        }
    }

    checkCollisions() {
        // 1. 캐릭터와 적 충돌 검사
        this.level.enemies.forEach((enemy, enemyIndex) => {
            if (!enemy.isDead && this.character.isColliding(enemy)) {
                let isFalling = this.character.speedY < 0 || this.character.isAboveGround();

                if (isFalling && !(enemy instanceof Endboss)) {
                    enemy.die();
                    this.character.speedY = 15;
                    setTimeout(() => {
                        this.level.enemies.splice(enemyIndex, 1);
                    }, 500);
                } else if (!isFalling && !this.character.isHurt()) {
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy);
                }
            }
        });

        // 2. 던진 병과 적 충돌 검사
        this.throwableObjects.forEach((bottle, bottleIndex) => {
            this.level.enemies.forEach((enemy, enemyIndex) => {
                if (!bottle.isSplashed && !enemy.isDead && bottle.isColliding(enemy)) {
                    bottle.splash();

                    if (enemy instanceof Chicken) {
                        enemy.die();
                        setTimeout(() => {
                            this.level.enemies.splice(enemyIndex, 1);
                        }, 500);
                    }

                    setTimeout(() => {
                        this.throwableObjects.splice(bottleIndex, 1);
                    }, 200);
                }
            });
        });

        // 3. 바닥 병 수집 충돌 검사
        if (this.level.bottles) {
            this.level.bottles.forEach((bottle, index) => {
                if (this.character.isColliding(bottle)) {
                    this.availableBottles++;
                    this.level.bottles.splice(index, 1);
                }
            });
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. 카메라 이동 후 월드 객체 렌더링
        this.ctx.translate(this.camera_x, 0);

        this.addObjectsToMap(this.level.backgroundObjects);
        this.addToMap(this.character);
        this.addObjectsToMap(this.level.clouds);

        if (this.level.bottles) {
            this.addObjectsToMap(this.level.bottles); // 바닥 병 렌더링
        }

        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.throwableObjects);

        this.ctx.translate(-this.camera_x, 0);

        // 2. 고정 UI (상태바)
        this.addToMap(this.statusBar);

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

        if (mo.drawFrame) {
            mo.drawFrame(this.ctx);
        }

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