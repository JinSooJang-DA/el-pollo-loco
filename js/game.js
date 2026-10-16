/**
 * Main game canvas element.
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * Global game world instance.
 * @type {World}
 */
let world;

/**
 * Keyboard input tracking instance.
 * @type {Keyboard}
 */
let keyboard = new Keyboard();

/**
 * Sound mute state flag.
 * @type {boolean}
 */
let isMuted = false;

/**
 * Audio hub collection mapping game events to Audio objects.
 * @type {Object.<string, HTMLAudioElement>}
 */
const AUDIO_HUB = {
    bgm: new Audio('audio/music.mp3'),
    jump: new Audio('audio/jump.mp3'),
    throw: new Audio('audio/throw.mp3'),
    bottleSplash: new Audio('audio/splash.mp3'),
    chickenDead: new Audio('audio/chicken.mp3'),
    bossHurt: new Audio('audio/boss_hurt.mp3'),
    win: new Audio('audio/win.mp3'),
    lost: new Audio('audio/lost.mp3')
};

/**
 * Initializes the canvas, loads mute preferences, and registers touch events.
 */
function init() {
    canvas = document.getElementById('canvas');
    loadMutePreference();
    bindTouchEvents();
}

/**
 * Loads the stored mute state from localStorage and updates UI accordingly.
 */
function loadMutePreference() {
    let savedMute = localStorage.getItem('isMuted');
    if (savedMute !== null) {
        isMuted = savedMute === 'true';
    }
    updateMuteUI();
    applyMuteState();
}

/**
 * Toggles audio mute state and stores the choice in localStorage.
 */
function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteUI();
    applyMuteState();
}

/**
 * Updates the sound toggle button icon in the UI.
 */
function updateMuteUI() {
    let soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.innerText = isMuted ? '🔇' : '🔊';
    }
}

/**
 * Applies the current mute state to all audio elements in AUDIO_HUB.
 */
function applyMuteState() {
    Object.values(AUDIO_HUB).forEach(audio => {
        audio.muted = isMuted;
    });
}

/**
 * Plays an audio clip if sound is not muted.
 * @param {HTMLAudioElement} sound - Audio element to play.
 */
function playSound(sound) {
    if (!isMuted && sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

/**
 * Hides start screen, initializes level entities, and launches the world instance.
 */
function startGame() {
    document.getElementById('startScreen').classList.add('d-none');
    initLevel();
    world = new World(canvas, keyboard);
    AUDIO_HUB.bgm.loop = true;
    playSound(AUDIO_HUB.bgm);
}

/**
 * Clears all active interval timers across the window.
 */
function stopAllIntervals() {
    for (let i = 1; i < 9999; i++) {
        window.clearInterval(i);
    }
}

/**
 * Resets running intervals, hides restart screen, and recreates the world.
 */
function restartGame() {
    stopAllIntervals();
    document.getElementById('restartScreen').classList.add('d-none');
    initLevel();
    world = new World(canvas, keyboard);
    playSound(AUDIO_HUB.bgm);
}

/**
 * Stops game timers, resets BGM, and returns to the initial landing screen.
 */
function backToMainMenu() {
    stopAllIntervals();
    AUDIO_HUB.bgm.pause();
    AUDIO_HUB.bgm.currentTime = 0;
    document.getElementById('restartScreen').classList.add('d-none');
    document.getElementById('startScreen').classList.remove('d-none');
    world = null;
}

/**
 * Opens the controls and rules modal dialog.
 */
function openInfoDialog() {
    document.getElementById('infoDialog').classList.remove('d-none');
}

/**
 * Closes the controls and rules modal dialog.
 */
function closeInfoDialog() {
    document.getElementById('infoDialog').classList.add('d-none');
}

/**
 * Closes dialog modal when clicking on the darkened backdrop.
 * @param {MouseEvent} event - Click event.
 */
function closeOnBackdrop(event) {
    if (event.target.id === 'infoDialog') {
        closeInfoDialog();
    }
}

/**
 * Opens the impressum page in a new browser tab.
 */
function openImpressum() {
    window.open('impressum.html', '_blank');
}

/**
 * Toggles fullscreen display for the game container.
 */
function toggleFullscreen() {
    let container = document.getElementById('gameContainer');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

/**
 * Binds touchstart, touchend, and prevents context menus on a virtual touch button.
 * @param {string} btnId - Element ID of the touch button.
 * @param {string} keyProperty - Keyboard property name (e.g. 'LEFT', 'SPACE').
 */
function bindTouchButton(btnId, keyProperty) {
    let btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keyboard[keyProperty] = true;
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keyboard[keyProperty] = false;
    }, { passive: false });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * Binds all mobile touch controls to their respective keyboard triggers.
 */
function bindTouchEvents() {
    bindTouchButton('btnLeft', 'LEFT');
    bindTouchButton('btnRight', 'RIGHT');
    bindTouchButton('btnJump', 'SPACE');
    bindTouchButton('btnThrow', 'D');
}

window.addEventListener('keydown', (e) => {
    if (e.keyCode === 39) keyboard.RIGHT = true;
    if (e.keyCode === 37) keyboard.LEFT = true;
    if (e.keyCode === 38) keyboard.UP = true;
    if (e.keyCode === 40) keyboard.DOWN = true;
    if (e.keyCode === 32) keyboard.SPACE = true;
    if (e.keyCode === 68) keyboard.D = true;
});

window.addEventListener('keyup', (e) => {
    if (e.keyCode === 39) keyboard.RIGHT = false;
    if (e.keyCode === 37) keyboard.LEFT = false;
    if (e.keyCode === 38) keyboard.UP = false;
    if (e.keyCode === 40) keyboard.DOWN = false;
    if (e.keyCode === 32) keyboard.SPACE = false;
    if (e.keyCode === 68) keyboard.D = false;
});