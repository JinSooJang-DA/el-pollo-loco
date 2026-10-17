
/** @type {HTMLCanvasElement} */
let canvas;

/** @type {World} */
let world;

/** @type {Keyboard} */
let keyboard = new Keyboard();

/** @type {boolean} */
let isMuted = false;

/** @type {boolean} */
let isPaused = false;

/** @type {HTMLAudioElement|null} */
let currentBgm = null;

/** @type {number} */
let bgmVolume = 0.5;

/** @type {number} */
let sfxVolume = 0.5;

/** @type {Object.<string, HTMLAudioElement>} */
const AUDIO_HUB = {
    bgmMenu: new Audio('audio/bgm01.mp3'),
    bgmGame: new Audio('audio/bgm02.mp3'),
    bgmBoss: new Audio('audio/bgm03.mp3'),
    bgmLost: new Audio('audio/bgm04.mp3'),
    bgmWin: new Audio('audio/bgm05.mp3'),
    jump: new Audio('audio/jump.mp3'),
    run: new Audio('audio/run.mp3'),
    throw: new Audio('audio/throw.mp3'),
    bottleSplash: new Audio('audio/splash.mp3'),
    coinCollect: new Audio('audio/coin.mp3'),
    bottleCollect: new Audio('audio/bottle.mp3'),
    pepeSnore: new Audio('audio/snoring.mp3'),
    smallChickenDead: new Audio('audio/chick-dead.mp3'),
    chickenDead: new Audio('audio/chicken-dead.mp3'),
    bossHurt: new Audio('audio/boss-hurt.mp3'),
    pepeHurt: new Audio('audio/hurt.mp3'),
    pepeDead: new Audio('audio/dead.mp3')
};
AUDIO_HUB.run.loop = true;

/** Initializes game elements and audio preferences. */
function init() {
    canvas = document.getElementById('canvas');
    loadMutePreference();
    loadVolumePreferences();
    bindTouchEvents();
    playBgm(AUDIO_HUB.bgmMenu);
    unlockAudioOnFirstInteraction();
}

/** Resumes audio after the first browser interaction. */
function unlockAudioOnFirstInteraction() {
    const resume = () => {
        resumeCurrentBgm();
        window.removeEventListener('click', resume);
        window.removeEventListener('keydown', resume);
    };
    window.addEventListener('click', resume);
    window.addEventListener('keydown', resume);
}

/** Loads the saved mute preference. */
function loadMutePreference() {
    const savedMute = localStorage.getItem('isMuted');
    if (savedMute !== null) {
        isMuted = savedMute === 'true';
    }
    updateMuteUI();
    applyMuteState();
}

/** Toggles and stores the mute preference. */
function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteUI();
    applyMuteState();
    if (!isMuted) resumeCurrentBgm();
}

/** Updates the sound button icon. */
function updateMuteUI() {
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.innerText = isMuted ? 'Sound: Off' : 'Sound: On';
    }
}

/** Applies mute settings to all audio tracks. */
function applyMuteState() {
    Object.values(AUDIO_HUB).forEach(audio => {
        audio.muted = isMuted;
    });
    if (isMuted) stopSoundEffects();
}

/** Loads stored BGM and SFX volume values. */
function loadVolumePreferences() {
    const savedBgm = parseFloat(localStorage.getItem('bgmVolume'));
    const savedSfx = parseFloat(localStorage.getItem('sfxVolume'));
    if (Number.isFinite(savedBgm)) {
        bgmVolume = clampVolume(savedBgm);
    }
    if (Number.isFinite(savedSfx)) {
        sfxVolume = clampVolume(savedSfx);
    }
    syncVolumeSliders();
}

/**
 * Restricts a volume value to the range 0–1.
 * @param {number} value
 * @returns {number}
 */
function clampVolume(value) {
    return Math.min(1, Math.max(0, value));
}

/** Updates the volume sliders. */
function syncVolumeSliders() {
    const bgmSlider = document.getElementById('bgmSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    if (bgmSlider) bgmSlider.value = bgmVolume;
    if (sfxSlider) sfxSlider.value = sfxVolume;
}

/**
 * Changes the background music volume.
 * @param {string} val
 */
function changeBgmVolume(val) {
    const volume = parseFloat(val);
    if (!Number.isFinite(volume)) return;
    bgmVolume = clampVolume(volume);
    localStorage.setItem('bgmVolume', bgmVolume);
    if (currentBgm) currentBgm.volume = bgmVolume;
}

/**
 * Changes the sound effect volume.
 * @param {string} val
 */
function changeSfxVolume(val) {
    const volume = parseFloat(val);
    if (!Number.isFinite(volume)) return;
    sfxVolume = clampVolume(volume);
    localStorage.setItem('sfxVolume', sfxVolume);
}

/**
 * Starts a background music track.
 * @param {HTMLAudioElement} bgmTrack
 */
function playBgm(bgmTrack) {
    if (currentBgm) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
    }
    currentBgm = bgmTrack;
    if (!currentBgm) return;
    currentBgm.loop = true;
    currentBgm.volume = bgmVolume;
    currentBgm.muted = isMuted;
    resumeCurrentBgm();
}

/** Resumes the active background music if allowed. */
function resumeCurrentBgm() {
    if (!currentBgm || isMuted || isPaused) return;
    if (!currentBgm.paused) return;
    currentBgm.play().catch(() => {});
}

/**
 * Plays a sound effect with the configured volume.
 * @param {HTMLAudioElement} sound
 */
function playSound(sound) {
    if (!sound || isMuted || isPaused) return;
    sound.volume = sfxVolume;
    sound.muted = isMuted;
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

/** Stops all active sound effects. */
function stopSoundEffects() {
    Object.values(AUDIO_HUB).forEach(audio => {
        if (audio === currentBgm) return;
        audio.pause();
        audio.currentTime = 0;
    });
}

/** Toggles game pause state. */
function togglePause() {
    if (!world || world.gameEnded) return;
    isPaused = !isPaused;
    updatePauseUI();
    handlePauseAudio();
}

/** Updates pause overlay and button icon. */
function updatePauseUI() {
    const screen = document.getElementById('pauseScreen');
    const button = document.getElementById('pauseBtn');
    if (screen) screen.classList.toggle('d-none', !isPaused);
    if (pauseBtn) pauseBtn.innerText = isPaused ? 'Resume' : 'Pause';
}

/** Handles audio when pausing or resuming. */
function handlePauseAudio() {
    if (isPaused) {
        if (currentBgm) currentBgm.pause();
        stopSoundEffects();
        return;
    }
    resumeCurrentBgm();
}

/** Resets the pause state. */
function resetPauseState() {
    isPaused = false;
    updatePauseUI();
}

/** Starts a new game. */
function startGame() {
    stopSoundEffects();
    resetPauseState();
    document.getElementById('startScreen').classList.add('d-none');
    initLevel();
    world = new World(canvas, keyboard);
    playBgm(AUDIO_HUB.bgmGame);
}

/** Clears active game intervals using the existing timer strategy. */
function stopAllIntervals() {
    for (let i = 1; i < 9999; i++) {
        window.clearInterval(i);
    }
}

/** Restarts the game without reloading the page. */
function restartGame() {
    stopAllIntervals();
    stopSoundEffects();
    resetPauseState();
    document.getElementById('restartScreen').classList.add('d-none');
    initLevel();
    world = new World(canvas, keyboard);
    playBgm(AUDIO_HUB.bgmGame);
}

/** Returns to the main menu. */
function backToMainMenu() {
    stopAllIntervals();
    stopSoundEffects();
    resetPauseState();
    document.getElementById('restartScreen').classList.add('d-none');
    document.getElementById('startScreen').classList.remove('d-none');
    world = null;
    playBgm(AUDIO_HUB.bgmMenu);
}

/** Opens the settings dialog. */
function openSettingsDialog() {
    const dialog = document.getElementById('settingsDialog');
    if (dialog) dialog.classList.remove('d-none');
}

/** Closes the settings dialog. */
function closeSettingsDialog() {
    const dialog = document.getElementById('settingsDialog');
    if (dialog) dialog.classList.add('d-none');
}

/**
 * Closes settings when the backdrop is clicked.
 * @param {MouseEvent} event
 */
function closeSettingsOnBackdrop(event) {
    if (event.target.id === 'settingsDialog') {
        closeSettingsDialog();
    }
}

/** Opens the game instructions dialog. */
function openInfoDialog() {
    document.getElementById('infoDialog').classList.remove('d-none');
}

/** Closes the game instructions dialog. */
function closeInfoDialog() {
    document.getElementById('infoDialog').classList.add('d-none');
}

/**
 * Closes instructions when the backdrop is clicked.
 * @param {MouseEvent} event
 */
function closeOnBackdrop(event) {
    if (event.target.id === 'infoDialog') {
        closeInfoDialog();
    }
}

/** Opens the legal information page. */
function openImpressum() {
    window.open('impressum.html', '_blank');
}

/** Toggles fullscreen mode. */
function toggleFullscreen() {
    if (document.activeElement) document.activeElement.blur();
    const container = document.getElementById('gameContainer');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

/**
 * Binds a mobile touch button.
 * @param {string} btnId
 * @param {string} keyProperty
 */
function bindTouchButton(btnId, keyProperty) {
    const button = document.getElementById(btnId);
    if (!button) return;
    button.addEventListener('touchstart', event => {
        event.preventDefault();
        keyboard[keyProperty] = true;
    }, { passive: false });
    button.addEventListener('touchend', event => {
        event.preventDefault();
        keyboard[keyProperty] = false;
    }, { passive: false });
    button.addEventListener('contextmenu', event => event.preventDefault());
}

/** Binds mobile movement and action buttons. */
function bindTouchEvents() {
    bindTouchButton('btnLeft', 'LEFT');
    bindTouchButton('btnRight', 'RIGHT');
    bindTouchButton('btnJump', 'SPACE');
    bindTouchButton('btnThrow', 'D');
}

/**
 * Updates keyboard state from a keyboard event.
 * @param {KeyboardEvent} event
 * @param {boolean} pressed
 */
function updateKeyboardState(event, pressed) {
    const keyMap = {
        39: 'RIGHT',
        37: 'LEFT',
        38: 'UP',
        40: 'DOWN',
        32: 'SPACE',
        68: 'D'
    };
    const property = keyMap[event.keyCode];
    if (property) keyboard[property] = pressed;
    if (event.keyCode === 32 && pressed) event.preventDefault();
}

window.addEventListener('keydown', (e) => {
    const startScreen = document.getElementById('startScreen');
    const isStartScreen = !startScreen.classList.contains('d-none');

    if (isStartScreen && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        if (!e.repeat && document.getElementById('infoDialog').classList.contains('d-none')
            && document.getElementById('settingsDialog').classList.contains('d-none')) {
            startGame();
        }
        return;
    }

    if (e.keyCode === 39) keyboard.RIGHT = true;
    if (e.keyCode === 37) keyboard.LEFT = true;
    if (e.keyCode === 38) keyboard.UP = true;
    if (e.keyCode === 40) keyboard.DOWN = true;
    if (e.keyCode === 32) {
        e.preventDefault();
        keyboard.SPACE = true;
    }
    if (e.keyCode === 68) keyboard.D = true;
});

window.addEventListener('keyup', event => {
    updateKeyboardState(event, false);
});

document.addEventListener('click', (event) => {
    const menu = document.querySelector('.game-menu');
    if (menu && !menu.contains(event.target)) {
        menu.open = false;
    }
});

/** Shows Pepe running before the start screen. */
function startLoadingAnimation() {
    let frame = 21;
    const pepe = document.getElementById('loadingPepe');

    const animation = setInterval(() => {
        pepe.src = `img/2_character_pepe/2_walk/W-${frame}.png`;
        frame = frame < 26 ? frame + 1 : 21;
    }, 120);

    setTimeout(() => {
        clearInterval(animation);
        document.getElementById('loadingScreen').remove();
    }, 1800);
}