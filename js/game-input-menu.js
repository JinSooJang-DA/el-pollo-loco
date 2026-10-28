/**
 * Returns whether a game-flow overlay must keep Escape unavailable.
 * @returns {boolean} True if a flow overlay is visible.
 */
function isGameplayFlowOverlayVisible() {
    return ['storyVideoScreen', 'levelRulesScreen', 'sombreroRewardScreen']
        .some(id => {
            const screen = document.getElementById(id);
            return screen && !screen.classList.contains('d-none');
        });
}

/**
 * Returns whether the existing lost or victory result screen is visible.
 * @returns {boolean} True if the result screen is visible.
 */
function isGameResultVisible() {
    const resultScreen = document.getElementById('restartScreen');
    return Boolean(resultScreen && !resultScreen.classList.contains('d-none'));
}

/**
 * Clears held gameplay controls before a Menu pause can resume.
 */
function clearGameMenuInput() {
    ['LEFT', 'RIGHT', 'UP', 'DOWN', 'SPACE', 'D'].forEach(key => {
        keyboard[key] = false;
    });
}

/**
 * Keeps the native Menu dropdown and existing pause state in sync.
 * @param {HTMLDetailsElement} menu The native Menu dropdown.
 */
function syncGameMenuPause(menu) {
    if (!menu.open && menuCloseKeepsPause) {
        menuCloseKeepsPause = false;
        return;
    }
    if (isGameResultVisible()) return syncResultScreenMenu(menu);
    if (isMenuCreditsOpen()) return;
    if (menu.open) return openGameMenuPause();
    closeGameMenuPause();
}

/**
 * Hides pause controls while the result screen owns the Menu.
 * @param {HTMLDetailsElement} menu The native Menu dropdown.
 */
function syncResultScreenMenu(menu) {
    if (!menu.open) return;
    clearGameMenuInput();
    document.getElementById('pauseBtn').classList.add('d-none');
    requestAnimationFrame(focusGameMenuControl);
}

/**
 * Applies the open-Menu pause lifecycle.
 */
function openGameMenuPause() {
    const startScreen = document.getElementById('startScreen');
    const isStartScreenVisible = startScreen && !startScreen.classList.contains('d-none');
    clearGameMenuInput();
    requestAnimationFrame(focusGameMenuControl);
    document.getElementById('pauseBtn').classList.remove('d-none');
    if (isStartScreenVisible || isGameplayFlowOverlayVisible() || isPaused) return;
    togglePause();
    menuPauseStartedAt = pauseStartedAt;
}

/**
 * Applies the closed-Menu pause lifecycle.
 */
function closeGameMenuPause() {
    const startScreen = document.getElementById('startScreen');
    const isStartScreenVisible = startScreen && !startScreen.classList.contains('d-none');
    if (isStartScreenVisible) {
        return;
    }
    blurGameplayMenuFocus();
    if (isGameplayFlowOverlayVisible() || isGameResultVisible()) return;
    if (isPaused) togglePause();
}

/**
 * Returns keyboard focus to gameplay when no overlay owns it.
 */
function blurGameplayMenuFocus() {
    if (isGameplayFlowOverlayVisible() || isGameResultVisible()) return;
    if (isMenuControlTarget(document.activeElement)) {
        document.activeElement.blur();
    }
}

/**
 * Opens or closes the existing Menu dropdown.
 * @param {boolean} isOpen Whether the Menu should be open.
 */
function setGameMenuOpen(isOpen) {
    const menu = document.querySelector('.game-menu');
    if (!menu) return;

    if (menu.open === isOpen) {
        if (isOpen) focusGameMenuControl();
        return;
    }

    menu.open = isOpen;
    syncGameMenuPause(menu);
}

/**
 * Closes an open dialog and returns focus to the parent Menu.
 * @returns {boolean} True if a dialog was closed.
 */
function closeMenuDialog() {
    if (closeBgmMenuDialog()) return true;
    const openDialog = getOpenMenuDialog();
    if (!openDialog) return false;
    openDialog[1]();
    return true;
}

/**
 * Closes the BGM dropdown and restores focus to its summary.
 * @returns {boolean} True if the BGM dropdown was closed.
 */
function closeBgmMenuDialog() {
    const bgmMenu = document.getElementById('bgmMenu');
    if (!bgmMenu || !bgmMenu.open) return false;
    bgmMenu.open = false;
    requestAnimationFrame(() => bgmMenu.querySelector('summary')?.focus());
    return true;
}

/**
 * Returns the first visible dialog together with its close handler.
 * @returns {Array|undefined} [dialogId, closeHandler] of the visible dialog, or undefined.
 */
function getOpenMenuDialog() {
    const dialogs = [
        ['settingsDialog', closeSettingsDialog],
        ['infoDialog', closeInfoDialog],
        ['legalDialog', closeLegalNotice]
    ];
    return dialogs.find(([id]) => {
        const dialog = document.getElementById(id);
        return dialog && !dialog.classList.contains('d-none');
    });
}

/**
 * Handles Escape without changing story, level, reward, or ending flow.
 * @param {KeyboardEvent} event The pressed keyboard event.
 */
function handleGameMenuEscape(event) {
    if (event.key !== 'Escape' || event.repeat) return;
    if (isMenuCreditsOpen()) return closeCreditsForEscape(event);
    if (closeMenuDialog()) return consumeEscapeEvent(event);
    if (isGameplayFlowOverlayVisible()) return;
    if (!canToggleGameplayMenu()) return;
    consumeEscapeEvent(event);
    toggleGameMenuFromEscape();
}

/**
 * Closes Menu Credits for Escape and consumes the key.
 * @param {KeyboardEvent} event The pressed Escape key.
 */
function closeCreditsForEscape(event) {
    consumeEscapeEvent(event);
    closeMenuCredits();
}

/**
 * Prevents other handlers from processing a consumed Escape.
 * @param {KeyboardEvent} event The consumed keyboard event.
 */
function consumeEscapeEvent(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
}

/**
 * Returns whether Escape may open or close the gameplay Menu.
 * @returns {boolean} True if Escape may toggle the Menu.
 */
function canToggleGameplayMenu() {
    const startScreen = document.getElementById('startScreen');
    const isStartScreenVisible = startScreen && !startScreen.classList.contains('d-none');
    const canControlGameplayMenu = pendingLevelNumber === null &&
        ((world && !world.gameEnded) || isGameResultVisible());
    return isStartScreenVisible || canControlGameplayMenu;
}

/**
 * Toggles the gameplay Menu and restores focus when closing.
 */
function toggleGameMenuFromEscape() {
    const wasMenuOpen = isGameMenuOpen();
    setGameMenuOpen(!wasMenuOpen);
    if (wasMenuOpen) focusGameMenuButton();
}

/**
 * Connects existing Menu clicks and Escape to the same pause lifecycle.
 */
function initGameMenuControls() {
    const menu = document.querySelector('.game-menu');
    if (!menu) return;

    menu.addEventListener('toggle', () => syncGameMenuPause(menu));
    menu.addEventListener('click', closeGameMenuForSelectedAction, true);
    document.addEventListener('keydown', handleGameMenuEscape, true);
    document.addEventListener('keydown', handleMenuFocus, true);
    document.addEventListener('keydown', handleArrowNavigation, true);
    document.addEventListener('keydown', handleUiActivation, true);
    document.addEventListener('keydown', preventRepeatedUiActivation, true);
    document.addEventListener('focusin', event => syncStartScreenSelection(event.target), true);
    document.addEventListener('pointerdown', closeGameMenuOnOutsidePointer, true);
}

let menuCloseKeepsPause = false;

/**
 * Start time of the Pause opened by the Menu, used to tell it apart from a Pause button Pause.
 * @type {number|null}
 */
let menuPauseStartedAt = null;

/**
 * Closes the dropdown for a selected action without resuming gameplay.
 * @param {MouseEvent} event The captured menu click.
 */
function closeGameMenuForSelectedAction(event) {
    const menu = document.querySelector('.game-menu');
    if (!menu?.open || !event.target.closest('button')) return;

    menuCloseKeepsPause = true;
    menu.open = false;
}

/**
 * Activates the focused UI button without letting gameplay input handle the key.
 * @param {KeyboardEvent} event The Enter or Space event.
 */
function handleUiActivation(event) {
    if (event.repeat || !['Enter', 'Space'].includes(event.code) ||
        !isUiNavigationActive()) return;

    const control = document.activeElement;
    if (!control?.matches('button, summary') ||
        !getUiNavigationControls().includes(control)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    closeInactiveSubmenus(control);
    control.click();
}

/**
 * Prevents held Enter or Space from repeatedly activating a focused UI button.
 * @param {KeyboardEvent} event The repeated keyboard event.
 */
function preventRepeatedUiActivation(event) {
    if (!event.repeat || !isUiNavigationActive()) return;
    if ((event.code === 'Enter' || event.code === 'Space') &&
        isMenuControlTarget(document.activeElement)) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}

/**
 * Closes an open Menu from a blank outer area before gameplay input can run.
 * @param {PointerEvent} event The pointer event outside the Menu.
 */
function closeGameMenuOnOutsidePointer(event) {
    const menu = document.querySelector('.game-menu');
    const isDialogClick = event.target.closest('.dialog-overlay');
    const isControlClick = isMenuControlTarget(event.target);

    if (!menu?.open || menu.contains(event.target) || isDialogClick || isControlClick) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    setGameMenuOpen(false);
}

// Keep Space for jumping outside native controls.
document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !isMenuControlTarget(event.target)) {
        event.preventDefault();
    }
}, true);

document.addEventListener('keyup', event => {
    if (event.code === 'Space' && !isMenuControlTarget(event.target)) {
        event.preventDefault();
    }
}, true);

/**
 * Starts the game using Enter or Space.
 * @param {KeyboardEvent} event The keyboard event to process.
 * @returns {boolean}
 */
function handleStartKey(event) {
    if (!isStartKeyEligible(event)) return false;
    event.preventDefault();
    if (!event.repeat && areStartDialogsClosed()) startGame();
    return true;
}

/**
 * Returns whether the event may start the game from the start screen.
 * @param {KeyboardEvent} event The keyboard event to test.
 * @returns {boolean}
 */
function isStartKeyEligible(event) {
    const startScreen = document.getElementById('startScreen');
    if (startScreen.classList.contains('d-none')) return false;
    if (event.code !== 'Enter' && event.code !== 'Space') return false;
    if (isMenuControlTarget(event.target)) return false;
    if (!document.getElementById('startBtn').classList.contains('is-keyboard-selected')) return false;
    return !isGameMenuOpen() && !document.getElementById('bgmMenu').open;
}

/**
 * Returns whether the info, settings, and legal dialogs are all closed.
 * @returns {boolean} True if all start dialogs are closed.
 */
function areStartDialogsClosed() {
    const isClosed = id => document.getElementById(id).classList.contains('d-none');
    return isClosed('infoDialog') && isClosed('settingsDialog') && isClosed('legalDialog');
}

window.addEventListener('keydown', event => {
    if (handleStartKey(event)) return;
    updateKeyboardState(event, true);
});

window.addEventListener('keyup', event => {
    updateKeyboardState(event, false);
});

/**
 * Closes dropdown menus when another control is clicked.
 */
document.addEventListener('click', event => {
    const gameMenu = document.querySelector('.game-menu');
    const bgmMenu = document.querySelector('.bgm-menu');
    const isDialogClick = event.target.closest('.dialog-overlay');

    if (gameMenu && !gameMenu.contains(event.target) && !isDialogClick &&
        isMenuControlTarget(event.target)) {
        gameMenu.open = false;
    }

    if (bgmMenu && !bgmMenu.contains(event.target)) {
        bgmMenu.open = false;
    }
});


/**
 * Plays the short Pepe loading animation.
 */
function startLoadingAnimation() {
    const pepe = document.getElementById('loadingPepe');
    if (!pepe) return;
    let frame = 21;
    const animation = setInterval(() => {
        frame = showLoadingPepeFrame(pepe, frame);
    }, 120);
    stopLoadingAnimation(animation);
}

/**
 * Shows one loading frame and returns the next frame number.
 * @param {HTMLImageElement} pepe The loading animation image.
 * @param {number} frame The current frame number.
 * @returns {number} The next frame number.
 */
function showLoadingPepeFrame(pepe, frame) {
    pepe.src = `img/2_character_pepe/2_walk/W-${frame}.png`;
    return frame < 26 ? frame + 1 : 21;
}

/**
 * Clears the loading animation after the intro delay.
 * @param {number} animation The interval id to clear.
 */
function stopLoadingAnimation(animation) {
    setTimeout(() => {
        clearInterval(animation);
        document.getElementById('loadingScreen').remove();
    }, 1800);
}
