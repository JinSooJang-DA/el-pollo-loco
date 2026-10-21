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
const baseStyles = read('styles/base.css');
const componentStyles = read('styles/components.css');
const levelRulesStyles = read('styles/level-rules.css');

function expect(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

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
