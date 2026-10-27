
/** @type {HTMLCanvasElement} */
let canvas;
/** @type {World} */
let world;
/** @type {Keyboard} */
let keyboard = new Keyboard();
/** @type {boolean} */
let isPaused = false;
/** @type {number} */
let pauseStartedAt = 0;
/** @type {'start'|'game'|null} */
let menuCreditsOrigin = null;
let menuCreditsBgmState = null;

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

/** Returns whether the main menu is currently displayed. */
function isMainMenuVisible() {
    let startScreen = document.getElementById('startScreen');
    return !startScreen || !startScreen.classList.contains('d-none');
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
    menuCreditsBgmState = openedFromGame && currentBgm ? {
        track: currentBgm,
        currentTime: currentBgm.currentTime
    } : null;

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
    const savedBgmState = menuCreditsBgmState;
    menuCreditsBgmState = null;

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
        document.getElementById('pauseScreen')?.classList.remove('d-none');
        updatePauseUI();
        playBgm(savedBgmState?.track || AUDIO_HUB.bgmGame);
        if (savedBgmState) currentBgm.currentTime = savedBgmState.currentTime;
    }

    requestAnimationFrame(() => {
        if (origin === 'game') {
            focusPauseResumeButton();
            return;
        }

        setGameMenuOpen(true);
        document.getElementById('creditsBtn')?.focus();
    });
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

/** Focuses Resume only after the paused game screen is visible. */
function focusPauseResumeButton() {
    const pauseScreen = document.getElementById('pauseScreen');
    const resumeButton = document.getElementById('resumeBtn');
    if (!world || isMainMenuVisible() || !isPaused ||
        pauseScreen?.classList.contains('d-none') || !resumeButton) {
        return false;
    }

    requestAnimationFrame(() => resumeButton.focus());
    return true;
}

/** Closes the parent Menu and restores the correct screen-specific focus. */
function closeMenuAfterDialog() {
    const menu = document.querySelector('.game-menu');

    if (menu) menu.open = false;

    if (isMainMenuVisible()) {
        requestAnimationFrame(focusGameMenuButton);
        return;
    }

    if (focusPauseResumeButton()) return;

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

    const presentation = document.querySelector('.game-presentation');

    if (!document.fullscreenElement) {
        if (!presentation?.requestFullscreen) return Promise.resolve(false);

        return presentation.requestFullscreen()
            .then(() => document.fullscreenElement === presentation)
            .catch(() => false);
    } else {
        return document.exitFullscreen()
            .then(() => false)
            .catch(() => Boolean(document.fullscreenElement));
    }
}
