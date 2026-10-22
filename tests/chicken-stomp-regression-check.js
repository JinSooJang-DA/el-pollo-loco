const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const combat = fs.readFileSync(
    path.join(root, 'models/world-combat.js'),
    'utf8'
);

function expect(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

let now = 1000;

class World { }
class Chicken { }
class SmallChicken { }
class Endboss { }

const context = {
    World,
    Chicken,
    SmallChicken,
    Endboss,
    Date: { now: () => now },
    AUDIO_HUB: {},
    playSound() { },
    playSpatialSound() { },
    setTimeout() { },
    world: null
};

vm.createContext(context);
vm.runInContext(combat, context);

function createChicken() {
    const chicken = new Chicken();
    Object.assign(chicken, {
        x: 100,
        y: 370,
        width: 65,
        height: 50,
        offset: { top: 8, bottom: 5, left: 8, right: 8 },
        energy: 5,
        lastStomp: 0,
        stompCooldown: 300,
        isDead: () => false,
        showStompReaction() { },
        die() { this.dead = true; }
    });
    return chicken;
}

function createWorld() {
    const testWorld = Object.create(context.World.prototype);
    testWorld.character = {
        x: 100,
        y: 125,
        width: 120,
        height: 280,
        offset: { top: 120, bottom: 30, left: 40, right: 30 },
        speedY: -5,
        energy: 100,
        isDead: () => false,
        isHurt: () => false,
        isColliding: () => true,
        lastFallSteps: [{
            from: 375,
            to: 380,
            left: 140,
            right: 190,
            time: now
        }]
    };
    testWorld.collectedCoins = 0;
    testWorld.maxCoins = 4;
    testWorld.statusBar = { setPercentage() { } };
    testWorld.statusBarCoin = { setPercentage() { } };
    testWorld.level = { enemies: [] };
    context.world = testWorld;
    return testWorld;
}

const testWorld = createWorld();
const firstChicken = createChicken();
const secondChicken = createChicken();

testWorld.handleEnemyContact(firstChicken);
expect(firstChicken.energy === 4 && testWorld.character.speedY === 15,
    'a downward top crossing stomps a normal chicken and starts the automatic bounce');

testWorld.handleEnemyContact(secondChicken);
expect(testWorld.character.energy === 100,
    'an overlapping second chicken cannot damage Pepe during the stomp bounce');

testWorld.handleEnemyContact(firstChicken);
expect(testWorld.character.energy === 100,
    'the just-stomped chicken cannot damage Pepe before the bounce clears its hitbox');

now += 201;
testWorld.handleEnemyContact(secondChicken);
expect(testWorld.character.energy === 60,
    'ordinary side contact still damages Pepe after the short bounce-only guard expires');

const sideContactWorld = createWorld();
sideContactWorld.character.lastFallSteps = [];
sideContactWorld.character.speedY = 0;
sideContactWorld.handleEnemyContact(createChicken());
expect(sideContactWorld.character.energy === 60,
    'a side contact without a prior stomp remains damaging');
