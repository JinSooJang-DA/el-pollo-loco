
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
/** @type {number} */
let pauseStartedAt = 0;
/** @type {HTMLAudioElement|null} */
let currentBgm = null;
/** @type {number} */
let bgmVolume = 0.5;
/** @type {number} */
let sfxVolume = 0.5;
/** @type {'start'|'game'|null} */
let menuCreditsOrigin = null;

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
    initGameMenuControls();
    initPlaylist();
    playStartVideo();
    playBgm(AUDIO_HUB.bgmMenu);
    unlockAudioOnFirstInteraction();
    showLocalEndingPreview();
    requestAnimationFrame(focusStartGameButton);
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
    if (typeof syncEndingRewardVideoAudio === 'function') syncEndingRewardVideoAudio();
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
    if (typeof syncEndingRewardVideoAudio === 'function') syncEndingRewardVideoAudio();
}

/**
 * Plays a background music track.
 * @param {HTMLAudioElement} bgmTrack
 * @param {boolean} [allowWhilePaused=false]
 */
function playBgm(bgmTrack, allowWhilePaused = false) {
    if (currentBgm === bgmTrack) {
        resumeCurrentBgm(allowWhilePaused);
        return;
    }

    if (currentBgm) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
    }

    currentBgm = bgmTrack;

    if (!currentBgm) return;

    currentBgm.loop = !playlistActive || playlistRepeat === 'track';
    currentBgm.volume = bgmVolume;
    currentBgm.muted = isMuted;

    resumeCurrentBgm(allowWhilePaused);
}

/** Resumes background music when allowed. */
function resumeCurrentBgm(allowWhilePaused = false) {
    if (!currentBgm || isMuted || (!allowWhilePaused && isPaused) || isStoryVideoPlaying()) return;
    if (currentBgm === AUDIO_HUB.bgmMenu && !isMainMenuVisible()) return;
    if (!currentBgm.paused) return;

    currentBgm.play().catch(() => { });
}

/** Returns whether the main menu is currently displayed. */
function isMainMenuVisible() {
    let startScreen = document.getElementById('startScreen');
    return !startScreen || !startScreen.classList.contains('d-none');
}

/**
 * Plays a sound effect.
 * @param {HTMLAudioElement} sound
 */
function playSound(sound) {
    if (!sound || isMuted || isPaused || isStoryVideoPlaying()) return;

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

    if (!isPaused) {
        pauseStartedAt = Date.now();
        pauseBossAttackTimers();
        isPaused = true;
    } else {
        let pausedFor = Date.now() - pauseStartedAt;
        isPaused = false;
        shiftPausedGameplayTimes(pausedFor);
        resumeBossAttackTimers();
        pauseStartedAt = 0;
    }
    updatePauseUI();
    handlePauseAudio();
}

/** Pauses pending Endboss attack phases without changing their remaining time. */
function pauseBossAttackTimers() {
    let boss = world?.level.enemies.find(enemy => enemy instanceof Endboss);
    boss?.pauseSpecialAttack();
}

/** Restarts a paused Endboss attack phase with its remaining delay. */
function resumeBossAttackTimers() {
    let boss = world?.level.enemies.find(enemy => enemy instanceof Endboss);
    boss?.resumeSpecialAttack();
}

/** Keeps gameplay cooldowns and temporary protection from expiring during Pause. */
function shiftPausedGameplayTimes(pausedFor) {
    if (!world || pausedFor <= 0) return;

    let character = world.character;
    shiftPauseTime(character, 'lastActionTime', pausedFor);
    shiftPauseTime(character, 'lastHit', pausedFor);
    shiftPauseTime(character, 'lastLandingTime', pausedFor);
    shiftPauseTime(character, 'stompBounceUntil', pausedFor);
    shiftPauseTime(character, 'reviveProtectionUntil', pausedFor);

    (character.lastFallSteps || []).forEach(step => {
        shiftPauseTime(step, 'time', pausedFor);
    });
    shiftPauseTime(character.lastFallStep, 'time', pausedFor);

    world.level.enemies.forEach(enemy => {
        shiftPauseTime(enemy, 'lastHit', pausedFor);
        shiftPauseTime(enemy, 'lastStomp', pausedFor);
        shiftPauseTime(enemy, 'lastStompBounce', pausedFor);
        shiftPauseTime(enemy, 'lastSpecialAttack', pausedFor);
    });
}

/** Moves one existing timestamp forward by the paused duration. */
function shiftPauseTime(target, property, pausedFor) {
    if (target && Number.isFinite(target[property]) && target[property] > 0) {
        target[property] += pausedFor;
    }
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
    pauseStartedAt = 0;
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

    playBgm(AUDIO_HUB.bgmGame);

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

    stopStartVideo();

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

    stopEndVideo();
    cancelEndingSequence();

    document.getElementById('restartScreen').classList.add('d-none');
    document.getElementById('endCredits').classList.add('d-none');

    resetSombreroGame();
    startLevel(1);
}

/** Returns to the start screen. */
function backToMainMenu() {
    closeGameOverlays();
    cancelEndingSequence();

    // Stop rendering the active world.
    if (world) {
        world.stopDrawing = true;
    }

    stopAllIntervals();
    stopSoundEffects();

    document.getElementById('startScreen').classList.remove('d-none');
    resetStartScreenMenuState();

    playStartVideo();

    world = null;
    resetPlaylist();
}

/** Closes menu panels and returns keyboard focus to Start Game. */
function resetStartScreenMenuState() {
    document.querySelector('.game-menu').open = false;
    document.getElementById('bgmMenu').open = false;
    requestAnimationFrame(focusStartGameButton);
}

/** Focuses Start Game when the initial screen becomes available. */
function focusStartGameButton() {
    const startButton = document.getElementById('startBtn');
    startButton?.classList.add('is-keyboard-selected');
    startButton?.focus();
}

/** Closes game overlays and cancels their pending continue actions. */
function closeGameOverlays() {
    cancelLevelRules();
    cancelSombreroReward();
    cancelStoryVideo();
    stopEndVideo();
    cancelEndingSequence();
    resetPauseState();

    ['restartScreen', 'settingsDialog', 'infoDialog', 'legalDialog'].forEach(id => {
        document.getElementById(id).classList.add('d-none');
    });
}

/** Plays the muted start-screen background when the browser permits it. */
function playStartVideo() {
    let video = document.getElementById('startVideo');
    if (!video) return;

    video.muted = true;
    video.play().catch(() => { });
}

/** Stops the start-screen background before the opening story begins. */
function stopStartVideo() {
    let video = document.getElementById('startVideo');
    if (!video) return;

    video.pause();
    video.currentTime = 0;
}

/** Plays the muted credits background when the victory screen is shown. */
function playEndVideo() {
    let video = document.getElementById('endVideo');
    if (!video) return;

    video.muted = true;
    video.play().catch(() => { });
}

/** Stops the credits background before leaving the victory screen. */
function stopEndVideo() {
    let video = document.getElementById('endVideo');
    if (!video) return;

    video.pause();
    video.currentTime = 0;
}

/** Returns whether the shared credits screen was opened from the Menu. */
function isMenuCreditsOpen() {
    return menuCreditsOrigin !== null;
}

/** Opens the existing credits screen without marking the game as completed. */
function openMenuCredits() {
    if (isMenuCreditsOpen()) return;

    const openedFromStart = isMainMenuVisible();
    const openedFromGame = world && !world.gameEnded;
    if (!openedFromStart && !openedFromGame) return;

    menuCreditsOrigin = openedFromStart ? 'start' : 'game';

    const menu = document.querySelector('.game-menu');
    const restartScreen = document.getElementById('restartScreen');
    const endCredits = document.getElementById('endCredits');
    const endScreenImage = document.getElementById('endScreenImg');
    const backButton = document.getElementById('menuCreditsBackBtn');

    if (menu) menu.open = false;
    if (endScreenImage) endScreenImage.classList.add('d-none');
    if (restartScreen) {
        restartScreen.classList.add('menu-credits-mode');
        restartScreen.classList.remove('d-none');
    }
    if (endCredits) endCredits.classList.remove('d-none');
    if (backButton) backButton.classList.remove('d-none');

    document.getElementById('pauseScreen')?.classList.add('d-none');
    stopStartVideo();
    stopSoundEffects();
    playEndVideo();
    AUDIO_HUB.bgmLost.pause();
    AUDIO_HUB.bgmLost.currentTime = 0;
    playBgm(AUDIO_HUB.bgmLost, true);
    requestAnimationFrame(() => backButton?.focus());
}

/** Closes Menu credits and restores the original Menu and BGM state. */
function closeMenuCredits() {
    const origin = menuCreditsOrigin;
    if (!origin) return;

    menuCreditsOrigin = null;

    const restartScreen = document.getElementById('restartScreen');
    const endCredits = document.getElementById('endCredits');
    const backButton = document.getElementById('menuCreditsBackBtn');

    stopEndVideo();
    if (endCredits) endCredits.classList.add('d-none');
    if (backButton) backButton.classList.add('d-none');
    if (restartScreen) {
        restartScreen.classList.remove('menu-credits-mode');
        restartScreen.classList.add('d-none');
    }

    if (origin === 'start') {
        playStartVideo();
        playBgm(AUDIO_HUB.bgmMenu);
    } else {
        updatePauseUI();
        playBgm(AUDIO_HUB.bgmGame);
    }

    setGameMenuOpen(true);
    requestAnimationFrame(() => document.getElementById('creditsBtn')?.focus());
}

/** Shows the ending locally without exposing a test control to players. */
function showLocalEndingPreview() {
    let isLocalHost = location.hostname === '127.0.0.1' ||
        location.hostname === 'localhost';
    let isEndingPreview = new URLSearchParams(location.search)
        .get('preview') === 'ending';

    if (!isLocalHost || !isEndingPreview) return;

    document.getElementById('startScreen').classList.add('d-none');
    document.getElementById('restartScreen').classList.remove('d-none');
    document.getElementById('endScreenImg').classList.add('d-none');
    document.getElementById('endCredits').classList.remove('d-none');
    stopStartVideo();
    playEndVideo();
    playBgm(AUDIO_HUB.bgmWin);
}

/** Opens the settings dialog. */
function openSettingsDialog() {
    const dialog = document.getElementById('settingsDialog');

    if (dialog) {
        dialog.classList.remove('d-none');
        requestAnimationFrame(() => document.getElementById('bgmSlider')?.focus());
    }
}

/** Closes the settings dialog. */
function closeSettingsDialog() {
    const dialog = document.getElementById('settingsDialog');

    if (dialog) dialog.classList.add('d-none');
    closeMenuAfterDialog();
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
    const dialog = document.getElementById('infoDialog');
    dialog.classList.remove('d-none');
    requestAnimationFrame(() => dialog.querySelector('.dialog-content')?.focus());
}

/** Closes the game instructions. */
function closeInfoDialog() {
    document.getElementById('infoDialog').classList.add('d-none');
    closeMenuAfterDialog();
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
    const dialog = document.getElementById('legalDialog');
    dialog.classList.remove('d-none');
    requestAnimationFrame(() => dialog.querySelector('.legal-content')?.focus());
}

/** Closes the legal notice. */
function closeLegalNotice() {
    document.getElementById('legalDialog').classList.add('d-none');
    closeMenuAfterDialog();
}

/** Focuses the Menu text button at the top of the game screen. */
function focusGameMenuButton() {
    document.querySelector('.game-menu > summary')?.focus();
}

/** Closes the parent Menu and restores the correct screen-specific focus. */
function closeMenuAfterDialog() {
    const menu = document.querySelector('.game-menu');

    if (menu) menu.open = false;

    if (isMainMenuVisible()) {
        requestAnimationFrame(focusGameMenuButton);
        return;
    }

    document.activeElement?.blur();
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
