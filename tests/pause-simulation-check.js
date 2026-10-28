const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
let now = 10000;
let nextTimerId = 1;
const intervals = new Map();
const timeouts = new Map();

function expect(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

function createTimerContext() {
    class DrawableObject {
        loadImage() { }
        loadImages() { }
    }

    class Character { }
    class ThrowablePlaceholder { }

    return {
        Date: { now: () => now },
        DrawableObject,
        Character,
        ThrowableObject: ThrowablePlaceholder,
        isPaused: false,
        world: null,
        setInterval(callback, delay) {
            let id = nextTimerId++;
            intervals.set(id, { callback, delay });
            return id;
        },
        clearInterval(id) {
            intervals.delete(id);
        },
        setTimeout(callback, delay) {
            let id = nextTimerId++;
            timeouts.set(id, { callback, delay });
            return id;
        },
        clearTimeout(id) {
            timeouts.delete(id);
        },
        playBottleSmashAt() { },
        audioHub: {},
        console
    };
}

const movableSource = fs.readFileSync(
    path.join(root, 'classes/movable-object.class.js'), 'utf8'
);
const movableContext = createTimerContext();
vm.createContext(movableContext);
vm.runInContext(`${movableSource}\nthis.MovableObject = MovableObject;`, movableContext);

const fallingObject = new movableContext.MovableObject();
fallingObject.y = 100;
fallingObject.speedY = 10;
fallingObject.isAboveGround = () => true;
fallingObject.applyGravity();
const gravityCallback = intervals.get(nextTimerId - 1).callback;

movableContext.isPaused = true;
gravityCallback();
expect(fallingObject.y === 100,
    'gravity keeps an airborne object fixed while gameplay is paused');

movableContext.isPaused = false;
gravityCallback();
expect(fallingObject.y === 90,
    'gravity resumes from the existing position without changing its step');

const throwableSource = fs.readFileSync(
    path.join(root, 'classes/throwable-object.class.js'), 'utf8'
);
vm.runInContext(`${throwableSource}\nthis.TestThrowableObject = ThrowableObject;`, movableContext);
const bottle = new movableContext.TestThrowableObject(100, 200, false);
movableContext.world = { removeBottleAfterDelay() { } };
const bottleFlight = intervals.get(bottle.throwInterval).callback;

movableContext.isPaused = true;
bottleFlight();
expect(bottle.x === 100,
    'a thrown bottle keeps its horizontal position while gameplay is paused');

movableContext.isPaused = false;
bottleFlight();
expect(bottle.x === 108,
    'a thrown bottle resumes with its existing horizontal speed');

const bossSource = fs.readFileSync(
    path.join(root, 'classes/endboss.class.js'), 'utf8'
);
const bossContext = createTimerContext();
bossContext.MovableObject = class {
    loadImage() { }
    loadImages() { }
    playAnimation() { }
    isHurt() { return false; }
    isDead() { return this.energy <= 0; }
};
vm.createContext(bossContext);
vm.runInContext(`${bossSource}\nthis.TestEndboss = Endboss;`, bossContext);

const boss = new bossContext.TestEndboss();
boss.hadFirstContact = true;
boss.animationStep = 10;
bossContext.world = {
    character: { x: 1900 },
    level: { level_end_x: 3000 }
};
const bossMove = [...intervals.values()].find(timer => timer.delay === 50);
const startX = boss.x;

bossContext.isPaused = true;
bossMove.callback();
expect(boss.x === startX,
    'the Endboss keeps its position while gameplay is paused');

bossContext.isPaused = false;
bossMove.callback();
expect(boss.x === startX - 6,
    'the Endboss resumes its existing chase movement after Pause');

boss.lastSpecialAttack = 0;
boss.checkSpecialAttack();
now += 300;
bossContext.isPaused = true;
boss.pauseSpecialAttack();
expect(boss.specialAttackRemaining === 700 && !boss.specialAttackTimer,
    'a boss preparation delay stores its remaining gameplay time on Pause');

now += 5000;
bossContext.isPaused = false;
boss.resumeSpecialAttack();
const resumedAttack = timeouts.get(boss.specialAttackTimer);
expect(resumedAttack.delay === 700,
    'a boss preparation delay does not spend Pause time before Resume');

resumedAttack.callback();
expect(!boss.isPreparingAttack && boss.isCharging,
    'the Endboss starts charging only after the remaining preparation delay');
