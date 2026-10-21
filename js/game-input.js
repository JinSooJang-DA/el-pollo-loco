
/**
 * Connects a mobile touch button to the keyboard.
 * @param {string} btnId
 * @param {string} keyProperty
 */

/** Connects a button to touch input. */
function bindTouchButton(btnId, keyProperty) {
    const button = document.getElementById(btnId);
    if (!button) return;
    button.addEventListener('touchstart',
        event => handleTouchStart(event, keyProperty), { passive: false });
    button.addEventListener('touchend',
        event => handleTouchEnd(event, keyProperty), { passive: false });
    button.addEventListener('touchcancel',
        event => handleTouchEnd(event, keyProperty));
    button.addEventListener('contextmenu', event => event.preventDefault());
}

/** Activates a touch control. */
function handleTouchStart(event, keyProperty) {
    event.preventDefault();
    if (isStoryVideoPlaying()) return;
    keyboard[keyProperty] = true;

    if (keyProperty === 'D' && world && !isPaused) {
        world.character.resetIdleTimer();
        world.checkThrowObjects();
        keyboard.D = false;
    }
}

/** Releases a touch control. */
function handleTouchEnd(event, keyProperty) {
    event.preventDefault();
    keyboard[keyProperty] = false;
}

/** Connects all mobile touch buttons. */
function bindTouchEvents() {
    bindTouchButton('btnLeft', 'LEFT');
    bindTouchButton('btnRight', 'RIGHT');
    bindTouchButton('btnJump', 'SPACE');
    bindTouchButton('btnThrow', 'D');
}

/**
 * Updates the keyboard state.
 * @param {KeyboardEvent} event
 * @param {boolean} pressed
 */
function updateKeyboardState(event, pressed) {
    if (isStoryVideoPlaying()) return;
    const keyMap = {
        39: 'RIGHT', 37: 'LEFT',
        38: 'UP', 40: 'DOWN',
        32: 'SPACE', 68: 'D'
    };
    const property = keyMap[event.keyCode];

    if (isMenuControlTarget(event.target)) return;

    if (property && isGameMenuOpen()) {
        if (pressed) event.preventDefault();
        return;
    }
    if (property) keyboard[property] = pressed;
    if (event.keyCode === 32 && pressed) event.preventDefault();
}

/** Returns whether the existing Menu dropdown is currently open. */
function isGameMenuOpen() {
    const menu = document.querySelector('.game-menu');
    return Boolean(menu && menu.open);
}

/** Returns whether a native control should keep its own keyboard behavior. */
function isMenuControlTarget(target) {
    return target instanceof Element && Boolean(target.closest(
        'button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
    ));
}

/** Returns visible, enabled controls inside a keyboard scope. */
function getFocusableControls(scope) {
    if (!scope) return [];

    return Array.from(scope.querySelectorAll(
        'summary, button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(control => control.getClientRects().length > 0);
}

/** Moves focus to the first visible existing Menu control. */
function focusGameMenuControl() {
    const menu = document.querySelector('.game-menu');
    if (!menu?.open) return;
    const controls = getFocusableControls(menu);
    const firstAction = controls.find(control => control.tagName === 'BUTTON');
    (firstAction || controls[0])?.focus();
}

/** Keeps Tab navigation within an open Menu or dialog. */
function keepFocusInScope(event, scope) {
    if (event.key !== 'Tab') return;

    const controls = getFocusableControls(scope);
    if (!controls.length) return;

    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !scope.contains(active))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (active === last || !scope.contains(active))) {
        event.preventDefault();
        first.focus();
    }
}

/** Keeps keyboard focus out of background controls while a dialog is visible. */
function handleMenuFocus(event) {
    if (isMenuCreditsOpen()) {
        keepFocusInScope(event, document.getElementById('restartScreen'));
        return;
    }

    const visibleDialog = ['settingsDialog', 'infoDialog', 'legalDialog']
        .map(id => document.getElementById(id))
        .find(dialog => dialog && !dialog.classList.contains('d-none'));
    if (visibleDialog) {
        keepFocusInScope(event, visibleDialog.querySelector('.dialog-card'));
        return;
    }

    const menu = document.querySelector('.game-menu');
    if (menu?.open) keepFocusInScope(event, menu);
}

/** Returns whether a game-flow overlay must keep Escape unavailable. */
function isGameplayFlowOverlayVisible() {
    return ['storyVideoScreen', 'levelRulesScreen', 'sombreroRewardScreen', 'restartScreen']
        .some(id => {
            const screen = document.getElementById(id);
            return screen && !screen.classList.contains('d-none');
        });
}

/** Clears held gameplay controls before a Menu pause can resume. */
function clearGameMenuInput() {
    ['LEFT', 'RIGHT', 'UP', 'DOWN', 'SPACE', 'D'].forEach(key => {
        keyboard[key] = false;
    });
}

/** Keeps the native Menu dropdown and existing pause state in sync. */
function syncGameMenuPause(menu) {
    if (isMenuCreditsOpen()) return;

    const startScreen = document.getElementById('startScreen');
    const isStartScreenVisible = startScreen && !startScreen.classList.contains('d-none');

    if (menu.open) {
        clearGameMenuInput();
        requestAnimationFrame(focusGameMenuControl);
        if (isStartScreenVisible || isGameplayFlowOverlayVisible()) return;
        if (!isPaused) togglePause();
        return;
    }

    // Release keyboard focus when the menu closes.
    if (menu.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    if (isStartScreenVisible || isGameplayFlowOverlayVisible()) {
        return;
    }

    if (isPaused) togglePause();
}

/** Opens or closes the existing Menu dropdown. */
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
        setGameMenuOpen(true);
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
    setGameMenuOpen(true);
    requestAnimationFrame(focusGameMenuControl);
    return true;
}

/** Handles Escape without changing story, level, reward, or ending flow. */
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
    const canControlGameplayMenu = world && !world.gameEnded && pendingLevelNumber === null;
    if (!isStartScreenVisible && !canControlGameplayMenu) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    setGameMenuOpen(!isGameMenuOpen());
}

/** Connects existing Menu clicks and Escape to the same pause lifecycle. */
function initGameMenuControls() {
    const menu = document.querySelector('.game-menu');
    if (!menu) return;

    menu.addEventListener('toggle', () => syncGameMenuPause(menu));
    document.addEventListener('keydown', handleGameMenuEscape, true);
    document.addEventListener('keydown', handleMenuFocus, true);
}

// Space is reserved for jumping, not menu activation.
document.addEventListener('keydown', event => {
    if (event.code === 'Space') {
        event.preventDefault();
    }
}, true);

document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
        event.preventDefault();
    }
}, true);

/**
 * Starts the game using Enter or Space.
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
function handleStartKey(event) {
    const startScreen = document.getElementById('startScreen');
    if (startScreen.classList.contains('d-none')) return false;
    if (event.code !== 'Enter') return false;
    if (isMenuControlTarget(event.target)) return false;
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

/** Closes dropdown menus when clicking outside. */
document.addEventListener('click', event => {
    const gameMenu = document.querySelector('.game-menu');
    const bgmMenu = document.querySelector('.bgm-menu');

    if (gameMenu && !gameMenu.contains(event.target)) {
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
