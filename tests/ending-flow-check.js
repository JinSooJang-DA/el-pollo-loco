const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const game = read('js/game.js');
const storyVideos = read('js/story-videos.js');
const sombrero = read('js/sombrero-system.js');
const world = read('models/world.class.js');
const worldRender = read('models/world-render.js');
const baseStyles = read('styles/base.css');
const componentStyles = read('styles/components.css');
const levelRulesStyles = read('styles/level-rules.css');
const gameInput = read('js/game-input.js');

function expect(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

function getEnemyLayout(file) {
    return [...read(file).matchAll(/new (Chicken|SmallChicken)\((\d+)\)/g)]
        .map(([, type, x]) => ({ type, x: Number(x) }));
}

function expectEnemyLayout(file, chickenCount, smallChickenCount) {
    const enemies = getEnemyLayout(file);
    const positions = enemies.map(enemy => enemy.x);
    const chickenTotal = enemies.filter(enemy => enemy.type === 'Chicken').length;
    const smallChickenTotal = enemies.filter(enemy => enemy.type === 'SmallChicken').length;

    expect(chickenTotal === chickenCount && smallChickenTotal === smallChickenCount &&
        new Set(positions).size === positions.length,
    `${file} has ${chickenCount} chickens, ${smallChickenCount} chicks, and unique positions`);
}

const bottlePositions = [...read('levels/level1.js').matchAll(/new Bottle\((\d+)\)/g)]
    .map(([, x]) => Number(x));

function expectChicksNearBottles(file) {
    const chickPositions = getEnemyLayout(file)
        .filter(enemy => enemy.type === 'SmallChicken')
        .map(enemy => enemy.x);
    const eachChickHasNearbyBottle = chickPositions.every(chickX =>
        bottlePositions.some(bottleX => Math.abs(bottleX - chickX) <= 120));

    expect(bottlePositions.length >= chickPositions.length && eachChickHasNearbyBottle,
        `${file} keeps each chick within reach of the existing bottle supply`);
}

expectEnemyLayout('levels/level1.js', 4, 2);
expectEnemyLayout('levels/level2.js', 6, 3);
expectEnemyLayout('levels/level3.js', 8, 4);
expectEnemyLayout('levels/level4.js', 10, 5);
expectEnemyLayout('levels/level5.js', 12, 6);
expectChicksNearBottles('levels/level1.js');
expectChicksNearBottles('levels/level2.js');
expectChicksNearBottles('levels/level3.js');
expectChicksNearBottles('levels/level4.js');
expectChicksNearBottles('levels/level5.js');
expect(getEnemyLayout('levels/level5.js').at(-1).x === 2220,
    'Level 5 keeps its last regular enemy clear of the boss approach');
expect(worldRender.includes('drawBackgroundObjects()') &&
    worldRender.includes('Math.round(this.camera_x) - this.camera_x') &&
    worldRender.includes('this.ctx.translate(pixelCorrection, 0)'),
    'background tiles use pixel-aligned rendering without changing camera movement');

expect(/id="startVideo"[\s\S]*videos\/stat-video\.mp4/.test(index),
    'start screen uses stat-video.mp4');
expect(/id="endVideo"[\s\S]*videos\/end-video\.mp4/.test(index),
    'credits screen uses end-video.mp4');
expect(/id="startVideo"[^>]*autoplay[^>]*muted[^>]*loop[^>]*playsinline/.test(index),
    'start video has autoplay-safe attributes');
expect(/id="endVideo"[^>]*autoplay[^>]*muted[^>]*loop[^>]*playsinline/.test(index),
    'end video has autoplay-safe attributes');
const creditEntries = [...index.matchAll(/class="credit-entry"/g)];
expect(creditEntries.length === 18,
    'ending contains all 18 requested credit cards');
expect(index.includes('JIN SOO JANG') && index.includes('JUNUS ERGIN') &&
    index.includes('GIULIANO GIOIA') && index.includes('GOOGLE GEMINI (LYRIA)'),
    'ending contains the supplied principal credit names');
expect(index.includes('BASED ON THE ORIGINAL GAME TUTORIAL BY') &&
    index.includes('GAME DESIGN &amp; EXTENDED DEVELOPMENT') &&
    index.includes('PROGRAMMING &amp; AI ASSISTANCE'),
    'ending credits Junus Ergin\'s tutorial contribution and the extended development correctly');
expect(!/🎮|🐔|🐥|❤️|👑/.test(index) &&
    index.includes('Menu &amp; Accessibility') &&
    index.includes('ESC</strong> Open / Close Menu') &&
    index.includes('TAB / SHIFT + TAB</strong> Navigate Menu') &&
    index.includes('ENTER / SPACE</strong> Select') &&
    index.includes('LEFT / RIGHT</strong> Adjust Volume (in Settings)'),
    'How to Play documents keyboard Menu and Settings controls without emoji');
expect(index.includes('img/3_enemies_chicken/chicken_normal/1_walk/1_w.png') &&
    index.includes('img/3_enemies_chicken/chicken_small/1_walk/1_w.png') &&
    index.includes('img/7_statusbars/3_icons/icon_health.png') &&
    index.includes('img/7_statusbars/3_icons/icon_coin.png') &&
    index.includes('img/4_enemie_boss_chicken/1_walk/G1.png'),
    'How to Play reuses the project chicken, health, coin, and boss assets');
expect(componentStyles.includes('#infoDialog .dialog-content') &&
    componentStyles.includes('overflow-y: auto;') &&
    componentStyles.includes('#infoDialog .dialog-card') &&
    componentStyles.includes('overflow: hidden;') &&
    componentStyles.includes('guide-section-heading'),
    'How to Play scrolls only its content while the close button remains available');
const expectedDelays = Array.from({ length: 18 }, (_, index) =>
    `--credit-delay: -${index * 4.5}s`);
expectedDelays[0] = '--credit-delay: 0s';
expect(expectedDelays.every(delay => index.includes(delay)),
    'each credit card has its place in the 18-card sequence');
expect(baseStyles.includes('animation: credit-cycle 81s') &&
    baseStyles.includes('@keyframes credit-cycle'),
    'credits repeat through one continuous 81-second CSS cycle');
expect(componentStyles.includes('.game-container:has(#restartScreen:not(.d-none) #endCredits:not(.d-none)) .game-menu') &&
    componentStyles.includes('.game-container:has(#startScreen.d-none) .bgm-menu') &&
    componentStyles.includes('display: none;'),
    'non-start screens hide top BGM and ending hides top Menu');
expect(baseStyles.includes("end/end-background.webp") &&
    baseStyles.includes('transition: opacity 1.5s ease') &&
    baseStyles.includes('body:has(#restartScreen:not(.d-none) #endCredits:not(.d-none))::after'),
    'ending crossfades to its dedicated outer background');
expect(/#levelRulesStartBtn,\s*#sombreroRewardScreen \.level-action-button/.test(levelRulesStyles) &&
    !componentStyles.includes('#sombreroRewardScreen button'),
    'sombrero continue button reuses the level action western style');
expect(game.includes('initGameMenuControls();') &&
    gameInput.includes("event.key !== 'Escape' || event.repeat") &&
    gameInput.includes('menu.addEventListener(\'toggle\'') &&
    gameInput.includes("document.getElementById('bgmMenu')") &&
    gameInput.includes('clearGameMenuInput();'),
    'Escape reuses the Menu pause lifecycle and clears held gameplay input');
expect(gameInput.includes('isMenuControlTarget(event.target)') &&
    gameInput.includes('keepFocusInScope(event,') &&
    gameInput.includes('requestAnimationFrame(focusGameMenuControl)') &&
    game.includes("document.getElementById('bgmSlider')?.focus()") &&
    game.includes('returnFocusToOpenGameMenu();'),
    'Menu keeps focus contained while native buttons and volume ranges retain keyboard behavior');

class KeyboardTestElement {
    constructor(isControl) {
        this.isControl = isControl;
    }

    closest() {
        return this.isControl ? this : null;
    }
}

const keyboardTestContext = {
    Element: KeyboardTestElement,
    keyboard: {},
    isStoryVideoPlaying: () => false,
    document: {
        addEventListener() { },
        querySelector(selector) {
            return selector === '.game-menu' ? { open: true } : null;
        }
    },
    window: { addEventListener() { } }
};
vm.runInNewContext(gameInput, keyboardTestContext);

let sliderDefaultPrevented = false;
keyboardTestContext.updateKeyboardState({
    keyCode: 39,
    target: new KeyboardTestElement(true),
    preventDefault() { sliderDefaultPrevented = true; }
}, true);
expect(!keyboardTestContext.keyboard.RIGHT && !sliderDefaultPrevented,
    'range arrow keys keep their native volume behavior and do not move Pepe');

let gameDefaultPrevented = false;
keyboardTestContext.updateKeyboardState({
    keyCode: 39,
    target: new KeyboardTestElement(false),
    preventDefault() { gameDefaultPrevented = true; }
}, true);
expect(!keyboardTestContext.keyboard.RIGHT && gameDefaultPrevented,
    'game movement remains blocked while the Menu is open');
expect(game.includes('playStoryVideo(1, () => startLevel(1))'),
    'start game opens story chapter 1 before level 1');
expect(storyVideos.includes('videos/loco-0${videoNumber}.mp4'),
    'story player constructs the requested chapter path');
expect(sombrero.includes('playStoryVideo(6, () => {') &&
    !sombrero.includes('playStoryVideo(7'),
    'level 5 uses only chapter 6 before the ending');
expect(sombrero.includes("showEndScreen('img/You won, you lost/You win B.png', true)") &&
    sombrero.includes('playBgm(AUDIO_HUB.bgmWin)'),
    'victory keeps the existing win music and opens credits');
expect(world.includes('showEndScreen(imagePath, isVictory = false)') &&
    world.includes('playEndVideo();') && world.includes('stopEndVideo();'),
    'result screen starts and stops the credits video by outcome');
expect(game.includes('stopStartVideo();') && game.includes('playStartVideo();') &&
    game.includes('stopEndVideo();'),
    'screen changes stop the previous video before the next state');
expect(game.includes("location.hostname === '127.0.0.1'") &&
    game.includes(".get('preview') === 'ending'"),
    'ending preview is restricted to local development hosts');

function classList() {
    return {
        values: new Set(['d-none']),
        add(value) { this.values.add(value); },
        remove(value) { this.values.delete(value); },
        toggle(value, force) {
            if (force) this.add(value);
            else this.remove(value);
        },
        contains(value) { return this.values.has(value); }
    };
}

const elements = {
    endScreenImg: { classList: classList() },
    restartScreen: { classList: classList() },
    endCredits: { classList: classList() },
    retryLevelBtn: { classList: classList() }
};
let endVideoStarts = 0;
let endVideoStops = 0;
const context = {
    document: { getElementById: id => elements[id] || null },
    stopAllIntervals() {},
    playEndVideo() { endVideoStarts++; },
    stopEndVideo() { endVideoStops++; },
    sombreros: 0,
    world: null
};

vm.createContext(context);
vm.runInContext(`${world}; globalThis.TestWorld = World;`, context);
const resultWorld = Object.create(context.TestWorld.prototype);
resultWorld.character = { isDead: () => false };
context.world = resultWorld;
resultWorld.showEndScreen('', true);
expect(endVideoStarts === 1 && !elements.endCredits.classList.contains('d-none') &&
    elements.endScreenImg.classList.contains('d-none'),
    'victory result reveals credits and starts the ending video');
resultWorld.setEndScreenImage = () => {};
resultWorld.showEndScreen('', false);
expect(endVideoStops === 1 && elements.endCredits.classList.contains('d-none'),
    'non-victory result stops and hides the ending video');

const rewardScreen = { classList: classList() };
let continuedLevel = null;
const sombreroContext = {
    document: {
        getElementById: id => id === 'sombreroRewardScreen' ? rewardScreen : null,
        addEventListener() {}
    },
    startLevel(levelNumber) { continuedLevel = levelNumber; }
};
vm.createContext(sombreroContext);
vm.runInContext(sombrero, sombreroContext);
vm.runInContext('rewardNextLevel = 3; continueAfterSombrero();', sombreroContext);
expect(rewardScreen.classList.contains('d-none') && continuedLevel === 3,
    'sombrero continue hides the reward and starts the stored next level');
