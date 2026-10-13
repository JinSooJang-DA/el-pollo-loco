class World {
    character = new Character();
    enemies = [
        new Chicken,
        new Chicken,
        new Chicken,
    ];
    canvas;
    ctx;

    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.draw();
        
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.drawImage(this.character.img, this.character.x, this.character.y, this.character.height = 100, this.character.width = 100);
        this.enemies.forEach(enemy => {
            this.ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height); 
        })
        //draw() wird immer wieder gerufen
        let self = this;
        requestAnimationFrame(function(){;
        self.draw();
        });
    }
}