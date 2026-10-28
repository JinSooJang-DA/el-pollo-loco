/**
 * Returns whether a level run is on screen without a flow or result overlay.
 * @returns {boolean} True while a level is being played or paused.
 */
function isRunActive() {
    if (typeof world === 'undefined' || !world || world.gameEnded) return false;
    if (isMainMenuVisible()) return false;
    return !isGameplayFlowOverlayVisible() && !isGameResultVisible();
}

/**
 * Returns whether live gameplay currently owns keyboard input.
 * @returns {boolean} True if the run is active, unpaused and no UI layer is open.
 */
function isGameplayInputActive() {
    return isRunActive() && !isPaused && !isUiNavigationActive();
}

/**
 * Returns whether the current Pause was started by opening the Menu with Escape.
 * @returns {boolean} True if the Menu caused the active Pause.
 */
function isPausedByGameMenu() {
    return isPaused && menuPauseStartedAt !== null && menuPauseStartedAt === pauseStartedAt;
}

/**
 * Returns whether a control performs one action and should hand input back to gameplay.
 * @param {EventTarget} target The clicked element.
 * @returns {boolean} True for the sound toggle and the BGM track buttons.
 */
function isOneShotControl(target) {
    return target instanceof Element &&
        Boolean(target.closest('#soundBtn, #bgmMenu .playlist-track'));
}

/**
 * Hands input back to gameplay after a one-shot control was used during a run.
 * Resumes only a Pause that the Menu started; a Pause from the Pause button stays.
 * @param {MouseEvent} event The click event.
 */
function handleOneShotControlClick(event) {
    if (!isOneShotControl(event.target) || !isRunActive()) return;
    document.getElementById('bgmMenu').open = false;
    if (isPausedByGameMenu()) togglePause();
    if (!isPaused) event.target.closest('button').blur();
}

/**
 * Stops Space or Enter from re-activating a focused control while gameplay runs,
 * so Space always jumps instead of toggling the last used button.
 * @param {KeyboardEvent} event The keyboard event.
 */
function blockControlKeysDuringGameplay(event) {
    if (!['Space', 'Enter'].includes(event.code) || !isGameplayInputActive()) return;
    if (!isMenuControlTarget(document.activeElement)) return;
    event.preventDefault();
    document.activeElement.blur();
}

/**
 * Opens the Menu when the browser leaves fullscreen through Escape during a run.
 * Browsers consume that Escape press, so the game never receives it as a key event.
 */
function handleFullscreenExit() {
    if (document.fullscreenElement) return;
    if (fullscreenExitRequested) {
        fullscreenExitRequested = false;
        return;
    }
    if (!isRunActive() || isPaused || isGameMenuOpen()) return;
    setGameMenuOpen(true);
}

document.addEventListener('click', handleOneShotControlClick);
document.addEventListener('keydown', blockControlKeysDuringGameplay, true);
document.addEventListener('keyup', blockControlKeysDuringGameplay, true);
document.addEventListener('fullscreenchange', handleFullscreenExit);
