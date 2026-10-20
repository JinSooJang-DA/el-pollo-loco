
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

/** Contains all background music and sound effects. */
const AUDIO_HUB = {
    bgmMenu: new Audio('audio/bgm01.mp3'),
    bgmGame: new Audio('audio/bgm02.mp3'),
    bgmBoss: new Audio('audio/bgm03.mp3'),
    bgmLost: new Audio('audio/bgm04.mp3'),
    bgmWin: new Audio('audio/bgm05.mp3'),
    jump: new Audio('audio/jump.mp3'),
    run: new Audio('audio/run.mp3'),
    throw: new Audio('audio/throw.mp3'),
    coinCollect: new Audio('audio/coin.mp3'),
    bottleCollect: new Audio('audio/bottle.mp3'),
    pepeSnore: new Audio('audio/snoring.mp3'),
    smallChickenDead: new Audio('audio/chick-dead.mp3'),
    chickenStomp: new Audio('audio/chicken-stomp.mp3'),
    chickenDead1: new Audio('audio/chicken-dead1.mp3'),
    chickenDead: new Audio('audio/chicken-dead.mp3'),
    bossHurt: new Audio('audio/boss-hurt.mp3'),
    pepeHurt: new Audio('audio/hurt.mp3'),
    pepeDead: new Audio('audio/dead.mp3')
};

AUDIO_HUB.run.loop = true;

/** Initializes the game and audio preferences. */
function init() {
    canvas = document.getElementById('canvas');
    loadMutePreference();
    loadVolumePreferences();
    bindTouchEvents();
    initPlaylist();
    playBgm(AUDIO_HUB.bgmMenu);
    unlockAudioOnFirstInteraction();
}

/** Allows background music after user interaction. */
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

/** Toggles and saves the mute preference. */
function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteUI();
    applyMuteState();

    if (!isMuted) resumeCurrentBgm();
}

/** Updates the sound button text. */
function updateMuteUI() {
    const soundBtn = document.getElementById('soundBtn');

    if (soundBtn) {
        soundBtn.innerText = isMuted ? 'Sound: Off' : 'Sound: On';
    }
}

/** Applies mute state to all audio elements. */
function applyMuteState() {
    Object.values(AUDIO_HUB).forEach(audio => {
        audio.muted = isMuted;
    });

    if (isMuted) stopSoundEffects();
    if (typeof syncStoryVideoMute === 'function') syncStoryVideoMute();
}

/** Loads stored volume preferences. */
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
 * Keeps volume between zero and one.
 * @param {number} value
 * @returns {number}
 */
function clampVolume(value) {
    return Math.min(1, Math.max(0, value));
}

/** Updates both volume sliders. */
function syncVolumeSliders() {
    const bgmSlider = document.getElementById('bgmSlider');
    const sfxSlider = document.getElementById('sfxSlider');

    if (bgmSlider) bgmSlider.value = bgmVolume;
    if (sfxSlider) sfxSlider.value = sfxVolume;
}

/**
 * Updates the BGM volume.
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
 * Updates the sound effect volume.
 * @param {string} val
 */
function changeSfxVolume(val) {
    const volume = parseFloat(val);

    if (!Number.isFinite(volume)) return;

    sfxVolume = clampVolume(volume);
    localStorage.setItem('sfxVolume', sfxVolume);
}

/**
 * Plays a background music track.
 * @param {HTMLAudioElement} bgmTrack
 */
function playBgm(bgmTrack) {
    if (currentBgm) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
    }

    currentBgm = bgmTrack;

    if (!currentBgm) return;

    currentBgm.loop = !playlistActive || playlistRepeat === 'track';
    currentBgm.volume = bgmVolume;
    currentBgm.muted = isMuted;

    resumeCurrentBgm();
}

/** Resumes background music when allowed. */
function resumeCurrentBgm() {
    if (!currentBgm || isMuted || isPaused) return;
    if (!currentBgm.paused) return;

    currentBgm.play().catch(() => { });
}

/**
 * Plays a sound effect.
 * @param {HTMLAudioElement} sound
 */
function playSound(sound) {
    if (!sound || isMuted || isPaused) return;

    sound.volume = sfxVolume;
    sound.muted = isMuted;
    sound.currentTime = 0;

    sound.play().catch(() => { });
}

/** Stops all sound effects except the current BGM. */
function stopSoundEffects() {
    Object.values(AUDIO_HUB).forEach(audio => {
        if (audio === currentBgm) return;

        audio.pause();
        audio.currentTime = 0;
    });
}

/** Toggles the game's pause state. */
function togglePause() {
    if (!world || world.gameEnded || pendingLevelNumber !== null) return;

    isPaused = !isPaused;
    updatePauseUI();
    handlePauseAudio();
}

/** Updates pause screen and button text. */
function updatePauseUI() {
    const screen = document.getElementById('pauseScreen');
    const button = document.getElementById('pauseBtn');

    if (screen) screen.classList.toggle('d-none', !isPaused);

    if (button) {
        button.innerText = isPaused ? 'Resume' : 'Pause';
    }
}

/** Pauses or resumes game audio. */
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

/**
 * Initializes and starts the selected level.
 * @param {number} levelNumber
 */
function startLevel(levelNumber) {
    if (levelNumber < 1 || levelNumber > 5) return;

    if (world) world.stopDrawing = true;

    stopAllIntervals();
    stopSoundEffects();

    if (levelNumber === 1) {
        // Level 1 안내문부터 게임 BGM 재생
        playBgm(AUDIO_HUB.bgmGame);
    }
    // Level 2~5는 이전 레벨의 승리 BGM을 유지

    showLevelRules(levelNumber);
}

/** Creates a fresh world only after the player accepts the rules. */
function beginLevel(levelNumber) {
    if (levelNumber === 1) initLevel();
    else if (levelNumber === 2) initLevel2();
    else if (levelNumber === 3) initLevel3();
    else if (levelNumber === 4) initLevel4();
    else if (levelNumber === 5) initLevel5();

    removeCollectedCoins(levelNumber);
    resetPauseState();

    world = new World(canvas, keyboard, levelNumber);
    world.draw();

    if (currentBgm !== AUDIO_HUB.bgmGame) {
    playBgm(AUDIO_HUB.bgmGame);
}
}

/** Starts a new game at Level 1. */
function startGame() {
    stopSoundEffects();
    resetPauseState();

    document.getElementById('startScreen').classList.add('d-none');

    deactivatePlaylist();
    resetSombreroGame();
    playStoryVideo(1, () => startLevel(1));
}

/** Clears the existing game intervals. */
function stopAllIntervals() {
    for (let i = 1; i < 9999; i++) {
        window.clearInterval(i);
    }
}

/** Restarts the game from Level 1. */
function restartGame() {
    stopSoundEffects();
    resetPauseState();

    document.getElementById('restartScreen').classList.add('d-none');

    resetSombreroGame();
    startLevel(1);
}

/** Returns to the start screen. */
function backToMainMenu() {
    cancelLevelRules();

    // Stop rendering the active world.
    if (world) {
        world.stopDrawing = true;
    }

    stopAllIntervals();
    stopSoundEffects();
    resetPauseState();

    document.getElementById('restartScreen').classList.add('d-none');
    document.getElementById('startScreen').classList.remove('d-none');

    world = null;
    resetPlaylist();
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

/** Opens the game instructions. */
function openInfoDialog() {
    document.getElementById('infoDialog').classList.remove('d-none');
}

/** Closes the game instructions. */
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

/** Opens the legal notice inside the game. */
function openImpressum() {
    document.getElementById('legalDialog').classList.remove('d-none');
}

/** Closes the legal notice. */
function closeLegalNotice() {
    document.getElementById('legalDialog').classList.add('d-none');
}

/**
 * Closes the legal notice when clicking outside.
 * @param {MouseEvent} event
 */
function closeLegalOnBackdrop(event) {
    if (event.target.id === 'legalDialog') {
        closeLegalNotice();
    }
}

/** Toggles fullscreen mode. */
function toggleFullscreen() {
    if (document.activeElement) {
        document.activeElement.blur();
    }

    const container = document.getElementById('gameContainer');

    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => { });
    } else {
        document.exitFullscreen().catch(() => { });
    }
}
