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

/**
 * True while the fullscreen button itself is leaving fullscreen.
 * @type {boolean}
 */
let fullscreenExitRequested = false;
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
    playBgm(audioHub.bgmMenu);
    unlockAudioOnFirstInteraction();
    showLocalEndingPreview();
    requestAnimationFrame(focusStartGameButton);
}

/**
 * Returns whether the main menu is currently displayed.
 * @returns {boolean} True if the main menu is visible.
 */
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

/**
 * Returns whether the shared credits screen was opened from the Menu.
 * @returns {boolean} True if credits were opened from the Menu.
 */
function isMenuCreditsOpen() {
    return menuCreditsOrigin !== null;
}

/** Opens the existing credits screen without marking the game as completed. */
function openMenuCredits() {
    if (isMenuCreditsOpen()) return;
    const openedFromStart = isMainMenuVisible();
    const openedFromGame = Boolean(world && !world.gameEnded);
    if (!openedFromStart && !openedFromGame) return;
    menuCreditsOrigin = openedFromStart ? 'start' : 'game';
    menuCreditsBgmState = getMenuCreditsBgmState(openedFromGame);
    showMenuCreditsScreen();
    playMenuCreditsMedia();
}

/**
 * Captures the gameplay BGM so it can resume after credits.
 * @param {boolean} openedFromGame Whether credits opened during gameplay.
 * @returns {{track: HTMLAudioElement, currentTime: number}|null}
 */
function getMenuCreditsBgmState(openedFromGame) {
    if (!openedFromGame || !currentBgm) return null;
    return { track: currentBgm, currentTime: currentBgm.currentTime };
}

/** Switches the existing result screen into credits mode. */
function showMenuCreditsScreen() {
    const menu = document.querySelector('.game-menu');
    const restartScreen = document.getElementById('restartScreen');
    const backButton = document.getElementById('menuCreditsBackBtn');
    if (menu) menu.open = false;
    document.getElementById('endScreenImg')?.classList.add('d-none');
    setMenuCreditsMode(restartScreen);
    document.getElementById('endCredits')?.classList.remove('d-none');
    if (backButton) backButton.classList.remove('d-none');
    document.getElementById('pauseScreen')?.classList.add('d-none');
    requestAnimationFrame(() => backButton?.focus());
}

/**
 * Shows the result screen in credits mode.
 * @param {HTMLElement} restartScreen The result screen element.
 */
function setMenuCreditsMode(restartScreen) {
    if (!restartScreen) return;
    restartScreen.classList.add('menu-credits-mode');
    restartScreen.classList.remove('d-none');
}

/** Plays the credits video and its BGM track. */
function playMenuCreditsMedia() {
    stopStartVideo();
    stopSoundEffects();
    playEndVideo();
    audioHub.bgmLost.pause();
    audioHub.bgmLost.currentTime = 0;
    playBgm(audioHub.bgmLost, true);
}

/** Closes Menu credits and restores the original Menu and BGM state. */
function closeMenuCredits() {
    const origin = menuCreditsOrigin;
    if (!origin) return;
    const savedBgmState = resetMenuCreditsState();
    hideMenuCreditsScreen();
    restoreMenuCreditsAudio(origin, savedBgmState);
    focusAfterMenuCredits(origin);
}

/**
 * Clears the saved credits state and returns the stored BGM.
 * @returns {{track: HTMLAudioElement, currentTime: number}|null} The saved BGM.
 */
function resetMenuCreditsState() {
    const savedBgmState = menuCreditsBgmState;
    menuCreditsOrigin = null;
    menuCreditsBgmState = null;
    return savedBgmState;
}

/** Hides the credits overlay and stops its background video. */
function hideMenuCreditsScreen() {
    const restartScreen = document.getElementById('restartScreen');
    stopEndVideo();
    document.getElementById('endCredits')?.classList.add('d-none');
    document.getElementById('menuCreditsBackBtn')?.classList.add('d-none');
    if (!restartScreen) return;
    restartScreen.classList.remove('menu-credits-mode');
    restartScreen.classList.add('d-none');
}

/**
 * Restores the start-screen or gameplay audio after closing credits.
 * @param {'start'|'game'} origin Where the credits were opened from.
 * @param {{track: HTMLAudioElement, currentTime: number}|null} savedBgmState Saved gameplay BGM state, or null.
 */
function restoreMenuCreditsAudio(origin, savedBgmState) {
    if (origin === 'start') {
        playStartVideo();
        playBgm(audioHub.bgmMenu);
        return;
    }
    document.getElementById('pauseScreen')?.classList.remove('d-none');
    updatePauseUI();
    playBgm(savedBgmState?.track || audioHub.bgmGame);
    if (savedBgmState) currentBgm.currentTime = savedBgmState.currentTime;
}

/**
 * Returns focus to Resume or the reopened Menu after closing credits.
 * @param {'start'|'game'} origin Where the credits were opened from.
 */
function focusAfterMenuCredits(origin) {
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
    if (!isLocalEndingPreview()) return;
    document.getElementById('startScreen').classList.add('d-none');
    document.getElementById('restartScreen').classList.remove('d-none');
    document.getElementById('endScreenImg').classList.add('d-none');
    document.getElementById('endCredits').classList.remove('d-none');
    stopStartVideo();
    playEndVideo();
    playBgm(audioHub.bgmWin);
}

/**
 * Returns whether the local ending preview was requested.
 * @returns {boolean} True if the local ending preview is active.
 */
function isLocalEndingPreview() {
    const isLocalHost = location.hostname === '127.0.0.1' ||
        location.hostname === 'localhost';
    const isEndingPreview = new URLSearchParams(location.search)
        .get('preview') === 'ending';
    return isLocalHost && isEndingPreview;
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

/**
 * Focuses Resume only after the paused game screen is visible.
 * @returns {boolean} True if the Resume button was focused.
 */
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
    blurActiveElement();
    const presentation = document.querySelector('.game-presentation');
    if (!document.fullscreenElement) return enterFullscreen(presentation);
    return exitFullscreen();
}

/** Removes focus from the control that triggered fullscreen. */
function blurActiveElement() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
}

/**
 * Requests fullscreen for the game presentation.
 * @param {Element|null} presentation The game presentation element.
 * @returns {Promise<boolean>}
 */
function enterFullscreen(presentation) {
    if (!presentation?.requestFullscreen) return Promise.resolve(false);
    return presentation.requestFullscreen()
        .then(() => document.fullscreenElement === presentation)
        .catch(() => false);
}

/**
 * Leaves fullscreen mode.
 * @returns {Promise<boolean>}
 */
function exitFullscreen() {
    fullscreenExitRequested = true;
    return document.exitFullscreen()
        .then(() => false)
        .catch(() => {
            fullscreenExitRequested = false;
            return Boolean(document.fullscreenElement);
        });
}