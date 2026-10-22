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
const responsiveStyles = read('styles/responsive.css');

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

expect(responsiveStyles.includes('width: min(100vw, 150dvh);') &&
    responsiveStyles.includes('aspect-ratio: 3 / 2;'),
    'mobile landscape keeps the 720 by 480 Canvas display at its 3:2 ratio');

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
    index.includes('ESC</strong> Open / Close Menu / Go Back') &&
    index.includes('TAB / SHIFT + TAB</strong> Navigate Buttons and Controls') &&
    index.includes('ARROW KEYS</strong> Navigate Menus and Screen Buttons') &&
    index.includes('↑ / ↓</strong> Scroll How to Play and Legal Notice') &&
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
expect(index.includes('id="creditsBtn"') && index.includes('onclick="openMenuCredits()"') &&
    index.includes('id="menuCreditsBackBtn"') && index.includes('onclick="closeMenuCredits()"'),
    'Menu exposes keyboard-accessible Credits and Back controls without duplicating credit markup');
expect(game.includes('function openMenuCredits()') && game.includes('function closeMenuCredits()') &&
    game.includes("playBgm(AUDIO_HUB.bgmLost, true)") &&
    game.includes('AUDIO_HUB.bgmLost.currentTime = 0;') &&
    game.includes('playBgm(AUDIO_HUB.bgmMenu);') &&
    game.includes('playBgm(AUDIO_HUB.bgmGame);') &&
    gameInput.includes('if (isMenuCreditsOpen())') &&
    componentStyles.includes('#restartScreen.menu-credits-mode'),
    'Menu credits uses BGM04, restores the source BGM, and keeps Escape focus-aware');
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
    game.includes('closeMenuAfterDialog();') &&
    game.includes("document.querySelector('.game-menu > summary')?.focus();") &&
    game.includes('requestAnimationFrame(focusGameMenuButton);'),
    'Menu keeps focus contained while native buttons and volume ranges retain keyboard behavior');
expect(gameInput.includes('function handleArrowNavigation(event)') &&
    gameInput.includes('function moveMenuFocus(event, controls)') &&
    gameInput.includes('function handleStartScreenArrowNavigation(event)') &&
    gameInput.includes("event.key === 'ArrowDown'") &&
    gameInput.includes("document.getElementById('bgmSlider')") &&
    gameInput.includes("document.getElementById('sfxSlider')"),
    'arrow keys move focus through Menu, BGM controls, and Settings sliders');
expect(gameInput.includes("const isDialogClick = event.target.closest('.dialog-overlay');") &&
    gameInput.includes('!gameMenu.contains(event.target) && !isDialogClick'),
    'dialog close clicks do not trigger the outside-click Menu close rule');
expect(index.includes('aria-label="How to Play content"') &&
    index.includes('aria-label="Legal notice content"') &&
    componentStyles.includes('scrollbar-width: thin') &&
    componentStyles.includes('::-webkit-scrollbar-thumb') &&
    gameInput.includes('function scrollDialogContent(event)') &&
    game.includes("dialog.querySelector('.dialog-content')?.focus()") &&
    game.includes("dialog.querySelector('.legal-content')?.focus()"),
    'scrollable dialogs use styled scrollbars and receive keyboard focus');
expect(game.includes('function focusGameMenuButton()') &&
    gameInput.includes('if (wasMenuOpen) focusGameMenuButton();') &&
    !gameInput.includes('requestAnimationFrame(focusGameMenuButton)') &&
    gameInput.includes('const wasMenuOpen = isGameMenuOpen();'),
    'Escape returns focus to the Menu button after closing a Menu child or the Menu itself');
expect(game.includes('function closeMenuAfterDialog()') &&
    game.includes('if (menu) menu.open = false;') &&
    game.includes('requestAnimationFrame(focusGameMenuButton);') &&
    game.includes('document.activeElement?.blur();') &&
    gameInput.includes('if (isStartScreenVisible) {'),
    'dialog close separates start-screen Menu focus from gameplay focus clearing');
expect(!gameInput.includes('function isStartMenuSummary') &&
    gameInput.includes("event.code === 'Space' && !isMenuControlTarget(event.target)"),
    'Space keeps the native start Menu behavior while gameplay controls remain protected');
expect(gameInput.includes('function handleGameOverKey(event)') &&
    gameInput.includes('event.repeat') &&
    gameInput.includes('button.click();') &&
    world.includes('focusGameOverButton(canRetry);'),
    'loss screen focuses Retry or Play Again and prevents repeated keyboard activation');

class KeyboardTestElement {
    constructor(isControl, tagName = 'BUTTON') {
        this.isControl = isControl;
        this.tagName = tagName;
    }

    closest() {
        return this.isControl ? this : null;
    }

    getClientRects() {
        return [{}];
    }

    focus() {
        keyboardTestContext.document.activeElement = this;
    }
}

const keyboardTestContext = {
    Element: KeyboardTestElement,
    keyboard: {},
    isStoryVideoPlaying: () => false,
    isMenuCreditsOpen: () => false,
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

const firstMenuButton = new KeyboardTestElement(true);
const lastMenuButton = new KeyboardTestElement(true);
const bgmMenuButton = new KeyboardTestElement(true, 'SUMMARY');
const gameMenuButton = new KeyboardTestElement(true, 'SUMMARY');
const startButton = new KeyboardTestElement(true);
const menuCreditsBackButton = new KeyboardTestElement(true);
const bgmSlider = new KeyboardTestElement(true, 'INPUT');
const sfxSlider = new KeyboardTestElement(true, 'INPUT');
let settingsOpen = false;
const arrowMenu = {
    open: true,
    querySelectorAll() { return [firstMenuButton, lastMenuButton]; },
    querySelector(selector) { return selector === 'summary' ? gameMenuButton : null; }
};
const arrowBgmMenu = {
    open: false,
    querySelector(selector) { return selector === 'summary' ? bgmMenuButton : null; },
    querySelectorAll() { return [bgmMenuButton]; }
};
const arrowSettings = {
    classList: { contains: () => !settingsOpen }
};
let infoDialogOpen = false;
let dialogScrollDistance = 0;
const arrowInfoDialog = {
    classList: { contains: () => !infoDialogOpen },
    querySelector() {
        return {
            clientHeight: 200,
            scrollBy(x, y) { dialogScrollDistance += y; }
        };
    }
};
keyboardTestContext.document.querySelector = selector =>
    selector === '.game-menu' ? arrowMenu : null;
keyboardTestContext.document.getElementById = id => ({
    settingsDialog: arrowSettings,
    bgmMenu: arrowBgmMenu,
    bgmSlider,
    sfxSlider,
    startBtn: startButton,
    menuCreditsBackBtn: menuCreditsBackButton,
    infoDialog: arrowInfoDialog,
    legalDialog: { classList: { contains: () => true } }
}[id] || null);
keyboardTestContext.document.activeElement = lastMenuButton;
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowDown',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === firstMenuButton,
    'Menu ArrowDown wraps focus from its last button to its first button');

settingsOpen = true;
keyboardTestContext.document.activeElement = sfxSlider;
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowDown',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === bgmSlider,
    'Settings ArrowDown wraps focus between the existing volume sliders');

settingsOpen = false;
infoDialogOpen = true;
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowDown',
    preventDefault() { }
});
expect(dialogScrollDistance === 140,
    'ArrowDown scrolls visible How to Play text without moving menu focus');
infoDialogOpen = false;

settingsOpen = false;
arrowMenu.open = false;
keyboardTestContext.document.activeElement = startButton;
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowLeft',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === bgmMenuButton,
    'start screen ArrowLeft selects the BGM button without using Tab');
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowRight',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === gameMenuButton,
    'start screen ArrowRight selects the Menu button without using Tab');
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowDown',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === startButton,
    'start screen ArrowDown selects Start Game without using Tab');
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowUp',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === gameMenuButton,
    'start screen ArrowUp selects the Menu button without using Tab');

let menuCreditsOpen = true;
keyboardTestContext.isMenuCreditsOpen = () => menuCreditsOpen;
arrowMenu.open = false;
keyboardTestContext.document.activeElement = menuCreditsBackButton;
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowLeft',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === bgmMenuButton,
    'Menu Credits ArrowLeft selects BGM without leaving the game');
keyboardTestContext.handleArrowNavigation({
    key: 'ArrowDown',
    preventDefault() { }
});
expect(keyboardTestContext.document.activeElement === menuCreditsBackButton,
    'Menu Credits ArrowDown selects Back to Menu');
let creditsTabPrevented = false;
keyboardTestContext.handleMenuFocus({
    key: 'Tab',
    shiftKey: false,
    preventDefault() { creditsTabPrevented = true; }
});
expect(creditsTabPrevented && keyboardTestContext.document.activeElement === bgmMenuButton,
    'Menu Credits Tab cycles between Back to Menu and BGM');

keyboardTestContext.requestAnimationFrame = callback => callback();
keyboardTestContext.focusGameMenuButton = () => gameMenuButton.focus();
keyboardTestContext.closeSettingsDialog = () => {
    settingsOpen = false;
    keyboardTestContext.focusGameMenuButton();
};
keyboardTestContext.closeInfoDialog = () => { };
keyboardTestContext.closeLegalNotice = () => { };
menuCreditsOpen = false;
keyboardTestContext.isPaused = true;
settingsOpen = true;
arrowMenu.open = true;
keyboardTestContext.document.activeElement = sfxSlider;
keyboardTestContext.closeMenuDialog();
expect(keyboardTestContext.document.activeElement === gameMenuButton,
    'Escape from Settings returns focus to the visible Menu button');
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

class TestAudio {
    constructor(src) {
        this.src = src;
        this.paused = true;
        this.currentTime = 0;
        this.loop = false;
        this.volume = 1;
        this.muted = false;
    }

    play() {
        this.paused = false;
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
    }
}

function createMenuCreditElement() {
    return {
        classList: classList(),
        paused: true,
        currentTime: 0,
        focus() { this.focused = true; },
        play() { this.paused = false; return Promise.resolve(); },
        pause() { this.paused = true; }
    };
}

const menuCreditElements = {
    startScreen: createMenuCreditElement(),
    restartScreen: createMenuCreditElement(),
    endCredits: createMenuCreditElement(),
    endScreenImg: createMenuCreditElement(),
    menuCreditsBackBtn: createMenuCreditElement(),
    pauseScreen: createMenuCreditElement(),
    startVideo: createMenuCreditElement(),
    endVideo: createMenuCreditElement(),
    creditsBtn: createMenuCreditElement(),
    pauseBtn: createMenuCreditElement()
};
menuCreditElements.startScreen.classList.remove('d-none');

const menuCreditMenu = { open: true };
const menuCreditContext = {
    Audio: TestAudio,
    Keyboard: class { },
    document: {
        getElementById: id => menuCreditElements[id] || null,
        querySelector: selector => selector === '.game-menu' ? menuCreditMenu : null
    },
    window: { addEventListener() { }, removeEventListener() { }, clearInterval() { } },
    localStorage: { getItem() { return null; }, setItem() { } },
    requestAnimationFrame(callback) { callback(); },
    isStoryVideoPlaying() { return false; },
    playlistActive: false,
    playlistRepeat: 'track',
    setGameMenuOpen(isOpen) { menuCreditMenu.open = isOpen; }
};
vm.createContext(menuCreditContext);
vm.runInContext(`${game}
globalThis.menuCreditApi = {
    open: openMenuCredits,
    close: closeMenuCredits,
    getCurrent: () => currentBgm,
    getAudioHub: () => AUDIO_HUB,
    setGameOrigin: () => {
        document.getElementById('startScreen').classList.add('d-none');
        world = { gameEnded: false };
        isPaused = true;
    },
    isPaused: () => isPaused
};`, menuCreditContext);

menuCreditContext.menuCreditApi.open();
expect(menuCreditContext.menuCreditApi.getCurrent() === menuCreditContext.menuCreditApi.getAudioHub().bgmLost &&
    !menuCreditElements.restartScreen.classList.contains('d-none') &&
    !menuCreditElements.endCredits.classList.contains('d-none'),
    'start Menu credits starts BGM04 and reuses the ending credits screen');
menuCreditContext.menuCreditApi.close();
expect(menuCreditContext.menuCreditApi.getCurrent() === menuCreditContext.menuCreditApi.getAudioHub().bgmMenu &&
    menuCreditMenu.open && menuCreditElements.creditsBtn.focused,
    'closing start Menu credits restores BGM01 and Credits focus');

menuCreditContext.menuCreditApi.setGameOrigin();
menuCreditContext.menuCreditApi.open();
menuCreditContext.menuCreditApi.close();
expect(menuCreditContext.menuCreditApi.getCurrent() === menuCreditContext.menuCreditApi.getAudioHub().bgmGame &&
    menuCreditContext.menuCreditApi.isPaused(),
    'closing gameplay Menu credits selects BGM02 while retaining the existing pause state');
