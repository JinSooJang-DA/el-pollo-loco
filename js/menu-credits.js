/**
 * Where the Menu credits were opened from, or null while they are closed.
 * @type {'start'|'game'|null}
 */
let menuCreditsOrigin = null;

/**
 * Gameplay BGM state saved while the Menu credits are open.
 * @type {{track: HTMLAudioElement, currentTime: number}|null}
 */
let menuCreditsBgmState = null;

/**
 * Returns whether the shared credits screen was opened from the Menu.
 * @returns {boolean} True if credits were opened from the Menu.
 */
function isMenuCreditsOpen() {
    return menuCreditsOrigin !== null;
}

/**
 * Opens the existing credits screen without marking the game as completed.
 */
function openMenuCredits() {
    if (isMenuCreditsOpen()) return;
    const openedFromStart = isMainMenuVisible();
    const openedFromGame = Boolean(world && !world.gameEnded);
    if (!openedFromStart && !openedFromGame) return;
    closeInactiveDialogs(null);
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

/**
 * Switches the existing result screen into credits mode.
 */
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

/**
 * Plays the credits video and its BGM track.
 */
function playMenuCreditsMedia() {
    stopStartVideo();
    stopSoundEffects();
    playEndVideo();
    audioHub.bgmLost.pause();
    audioHub.bgmLost.currentTime = 0;
    playBgm(audioHub.bgmLost, true);
}

/**
 * Closes Menu credits and restores the original Menu and BGM state.
 */
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

/**
 * Hides the credits overlay and stops its background video.
 */
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
 * Returns focus to Resume, or closes all menus and focuses Start Game after closing credits.
 * @param {'start'|'game'} origin Where the credits were opened from.
 */
function focusAfterMenuCredits(origin) {
    requestAnimationFrame(() => {
        if (origin === 'game') {
            focusPauseResumeButton();
            return;
        }
        resetStartScreenMenuState();
    });
}
