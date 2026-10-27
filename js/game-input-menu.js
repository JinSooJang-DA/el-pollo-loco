/** Returns whether a game-flow overlay must keep Escape unavailable. */
function isGameplayFlowOverlayVisible() {
    return ['storyVideoScreen', 'levelRulesScreen', 'sombreroRewardScreen']
        .some(id => {
            const screen = document.getElementById(id);
            return screen && !screen.classList.contains('d-none');
        });
}

/** Returns whether the existing lost or victory result screen is visible. */
function isGameResultVisible() {
    const resultScreen = document.getElementById('restartScreen');
    return Boolean(resultScreen && !resultScreen.classList.contains('d-none'));
}

/** Clears held gameplay controls before a Menu pause can resume. */
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

    if (isGameResultVisible()) {
        if (menu.open) {
            clearGameMenuInput();
            document.getElementById('pauseBtn').classList.add('d-none');
            requestAnimationFrame(focusGameMenuControl);
        }
        return;
    }
    if (isMenuCreditsOpen()) return;

    const startScreen = document.getElementById('startScreen');
    const isStartScreenVisible = startScreen && !startScreen.classList.contains('d-none');

    if (menu.open) {
        clearGameMenuInput();
        requestAnimationFrame(focusGameMenuControl);
        document.getElementById('pauseBtn').classList.remove('d-none');
        if (isStartScreenVisible || isGameplayFlowOverlayVisible()) return;
        if (!isPaused) togglePause();
        return;
    }

    // Keep the closed start-screen Menu button focused after a dialog closes.
    if (isStartScreenVisible) {
        return;
    }

    // Return Space and arrow keys to gameplay after leaving the game UI.
    if (!isGameplayFlowOverlayVisible() && !isGameResultVisible() &&
        isMenuControlTarget(document.activeElement)) {
        document.activeElement.blur();
    }

    if (isGameplayFlowOverlayVisible() || isGameResultVisible()) return;

    if (isPaused) togglePause();
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

/** Closes an open dialog and returns focus to the parent Menu. */
function closeMenuDialog() {
    const bgmMenu = document.getElementById('bgmMenu');
    if (bgmMenu && bgmMenu.open) {
        bgmMenu.open = false;
        requestAnimationFrame(() => bgmMenu.querySelector('summary')?.focus());
        return true;
    }

    const dialogs = [
        ['settingsDialog', closeSettingsDialog],
        ['infoDialog', closeInfoDialog],
        ['legalDialog', closeLegalNotice]
    ];
    const openDialog = dialogs.find(([id]) => {
        const dialog = document.getElementById(id);
        return dialog && !dialog.classList.contains('d-none');
    });

    if (!openDialog) return false;
    openDialog[1]();
    return true;
}

/**
 * Handles Escape without changing story, level, reward, or ending flow.
 * @param {KeyboardEvent} event The pressed keyboard event.
 */
function handleGameMenuEscape(event) {
    if (event.key !== 'Escape' || event.repeat) return;
    if (isMenuCreditsOpen()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeMenuCredits();
        return;
    }

    if (closeMenuDialog()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
    }

    if (isGameplayFlowOverlayVisible()) return;

    const startScreen = document.getElementById('startScreen');
    const isStartScreenVisible = startScreen && !startScreen.classList.contains('d-none');
    const canControlGameplayMenu = pendingLevelNumber === null &&
        ((world && !world.gameEnded) || isGameResultVisible());
    if (!isStartScreenVisible && !canControlGameplayMenu) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const wasMenuOpen = isGameMenuOpen();
    setGameMenuOpen(!wasMenuOpen);
    if (wasMenuOpen) focusGameMenuButton();
}

/** Connects existing Menu clicks and Escape to the same pause lifecycle. */
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
    const startScreen = document.getElementById('startScreen');
    if (startScreen.classList.contains('d-none')) return false;
    if (event.code !== 'Enter' && event.code !== 'Space') return false;
    if (isMenuControlTarget(event.target)) return false;
    if (!document.getElementById('startBtn').classList.contains('is-keyboard-selected')) return false;
    if (isGameMenuOpen() || document.getElementById('bgmMenu').open) return false;
    event.preventDefault();
    const infoClosed = document.getElementById('infoDialog').classList.contains('d-none');
    const settingsClosed = document.getElementById('settingsDialog').classList.contains('d-none');
    const legalClosed = document.getElementById('legalDialog').classList.contains('d-none');
    if (!event.repeat && infoClosed && settingsClosed && legalClosed) {
        startGame();
    }
    return true;
}

window.addEventListener('keydown', event => {
    if (handleStartKey(event)) return;
    updateKeyboardState(event, true);
});

window.addEventListener('keyup', event => {
    updateKeyboardState(event, false);
});

/** Closes dropdown menus when another control is clicked. */
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


/** Plays the short Pepe loading animation. */
function startLoadingAnimation() {
    let frame = 21;
    const pepe = document.getElementById('loadingPepe');
    if (!pepe) return;

    const animation = setInterval(() => {
        pepe.src = `img/2_character_pepe/2_walk/W-${frame}.png`;
        frame = frame < 26 ? frame + 1 : 21;
    }, 120);

    setTimeout(() => {
        clearInterval(animation);
        document.getElementById('loadingScreen').remove();
    }, 1800);
}
