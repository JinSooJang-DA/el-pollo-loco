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
