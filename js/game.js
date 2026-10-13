let canvas;
let world; // 선언만 먼저 해둡니다.

function init() {
    canvas = document.getElementById('canvas');
    world = new World(canvas); 

    console.log('my character is', world.character);
}