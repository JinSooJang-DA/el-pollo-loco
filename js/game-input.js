
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

    if (keyProperty === 'SPACE') {
        keyboard.SPACE = false;
        if (world && !isPaused && !world.gameEnded &&
            !world.character.isDead() && !world.character.isAboveGround()) {
            world.character.resetIdleTimer();
            world.character.jump();
        }
        return;
    }

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
    window.addEventListener('orientationchange', clearTouchControlState);
    window.addEventListener('resize', clearTouchControlState);
    window.addEventListener('blur', clearTouchControlState);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearTouchControlState();
    });
}

/** Releases active touch input when rotation, resizing, or app switching cancels it. */
function clearTouchControlState() {
    keyboard.LEFT = false;
    keyboard.RIGHT = false;
    keyboard.SPACE = false;
    keyboard.D = false;
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

    if (property && isUiNavigationActive()) {
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

/** Returns the visible controls available in the current non-gameplay UI. */
function getUiNavigationControls() {
    const startScreen = document.getElementById('startScreen');
    const gameMenu = document.querySelector('.game-menu');
    const bgmMenu = document.getElementById('bgmMenu');
    const visibleDialog = ['settingsDialog', 'infoDialog', 'legalDialog']
        .map(id => document.getElementById(id))
        .find(dialog => dialog && !dialog.classList.contains('d-none'));
    const visibleOverlay = Array.from(document.querySelectorAll(
        '.overlay-screen:not(.d-none), .story-video-screen:not(.d-none)'
    )).find(overlay => overlay.getClientRects().length > 0);
    const topControls = [
        bgmMenu?.querySelector('summary'),
        document.getElementById('soundBtn'),
        gameMenu?.querySelector('summary')
    ].filter(control => control && control.getClientRects().length > 0);
    const activeScope = visibleDialog || visibleOverlay;
    const scopedControls = activeScope ? getFocusableControls(activeScope) :
        (startScreen && !startScreen.classList.contains('d-none')
            ? [document.getElementById('startBtn')]
            : []);
    const menuControls = gameMenu?.open ? getFocusableControls(gameMenu) : [];
    const bgmControls = bgmMenu?.open ? getFocusableControls(bgmMenu) : [];

    return [...new Set([...topControls, ...menuControls, ...bgmControls, ...scopedControls])]
        .filter(control => !control.disabled && control.getClientRects().length > 0);
}

/** Returns whether visible UI should receive keyboard input instead of gameplay. */
function isUiNavigationActive() {
    const startScreen = document.getElementById('startScreen');
    return isGameMenuOpen() || Boolean(
        startScreen && !startScreen.classList.contains('d-none')
    ) || Array.from(document.querySelectorAll(
        '.dialog-overlay:not(.d-none), .overlay-screen:not(.d-none), .story-video-screen:not(.d-none)'
    )).some(overlay => overlay.getClientRects().length > 0);
}

/** Moves focus through all controls visible in the current UI state. */
function handleUiArrowNavigation(event) {
    if (!isUiNavigationActive()) return false;

    const controls = getUiNavigationControls();
    const isHorizontalArrow = ['ArrowLeft', 'ArrowRight', 'Left', 'Right']
        .includes(event.key);
    if (!controls.length || document.activeElement?.matches('select, textarea') ||
        (isHorizontalArrow && document.activeElement?.matches('input[type="range"]'))) {
        return false;
    }

    moveMenuFocus(event, controls);
    event.stopImmediatePropagation();
    return true;
}

/** Moves through the opened BGM menu before global UI navigation can leave it. */
function handleBgmMenuArrowNavigation(event) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return false;

    const bgmMenu = document.getElementById('bgmMenu');
    const controls = bgmMenu?.open ? getFocusableControls(bgmMenu) : [];
    if (!controls.includes(document.activeElement)) return false;

    moveMenuFocus(event, controls);
    return true;
}

/** Returns visible buttons inside a menu. */
function getMenuButtons(menu) {
    return getFocusableControls(menu).filter(control => control.tagName === 'BUTTON');
}

/** Returns controls that stay available while Menu Credits are open. */
function getMenuCreditsControls() {
    const bgmMenu = document.getElementById('bgmMenu');
    const backButton = document.getElementById('menuCreditsBackBtn');
    return [...getFocusableControls(bgmMenu), backButton]
        .filter(control => control && control.getClientRects().length > 0);
}

/** Moves focus through a list of controls and wraps at both ends. */
function moveMenuFocus(event, controls) {
    if (!controls.length) return;

    let currentIndex = controls.indexOf(document.activeElement);
    let direction = ['ArrowDown', 'ArrowRight', 'Down', 'Right']
        .includes(event.key) ? 1 : -1;
    let nextIndex = currentIndex + direction;

    if (currentIndex === -1) {
        nextIndex = direction === 1 ? 0 : controls.length - 1;
    } else if (nextIndex < 0) {
        nextIndex = controls.length - 1;
    } else if (nextIndex >= controls.length) {
        nextIndex = 0;
    }

    event.preventDefault();
    const nextControl = controls[nextIndex];
    closeInactiveSubmenus(nextControl);
    nextControl.focus();
}

/** Closes an open submenu only after keyboard focus leaves its controls. */
function closeInactiveSubmenus(nextControl) {
    const bgmMenu = document.getElementById('bgmMenu');
    if (bgmMenu?.open && !bgmMenu.contains(nextControl)) bgmMenu.open = false;

    const gameMenu = document.querySelector('.game-menu');
    if (gameMenu?.open && !gameMenu.contains(nextControl)) {
        menuCloseKeepsPause = true;
        gameMenu.open = false;
    }

    ['settingsDialog', 'infoDialog', 'legalDialog'].forEach(id => {
        const dialog = document.getElementById(id);
        if (dialog && !dialog.classList.contains('d-none') && !dialog.contains(nextControl)) {
            dialog.classList.add('d-none');
        }
    });
}

/** Returns whether a key represents one of the four UI navigation arrows. */
function isUiArrowKey(key) {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Up', 'Down', 'Left', 'Right'].includes(key);
}

/** Returns the visible existing actions shown after a game ends. */
function getGameOverButtons() {
    const restartScreen = document.getElementById('restartScreen');
    if (!restartScreen || restartScreen.classList.contains('d-none')) return [];

    return ['retryLevelBtn', 'restartBtn', 'homeBtn']
        .map(id => document.getElementById(id))
        .filter(button => button && button.getClientRects().length > 0);
}

/** Moves between result actions without changing their click behavior. */
function handleGameOverArrowNavigation(event) {
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isArrowKey) return false;

    const buttons = getGameOverButtons();
    if (!buttons.includes(document.activeElement)) return false;

    moveMenuFocus(event, buttons);
    return true;
}

/** Returns the three visible controls on the start screen. */
function getStartScreenControls() {
    const bgmMenu = document.getElementById('bgmMenu');
    const gameMenu = document.querySelector('.game-menu');
    const startButton = document.getElementById('startBtn');
    const soundButton = document.getElementById('soundBtn');

    return [
        bgmMenu?.querySelector('summary'),
        soundButton,
        gameMenu?.querySelector('summary'),
        startButton
    ].filter(control => control && control.getClientRects().length > 0);
}

/** Keeps the visible Start Game selection aligned with start-screen navigation. */
function syncStartScreenSelection(target) {
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startBtn');
    if (!startScreen || startScreen.classList.contains('d-none') || !startButton) return;

    startButton.classList.toggle('is-keyboard-selected', target === startButton);
}

/** Moves focus between the BGM, Menu, and Start Game controls. */
function handleStartScreenArrowNavigation(event) {
    const controls = getStartScreenControls();
    if (!controls.includes(document.activeElement)) return;

    const bgmButton = controls[0];
    const menuButton = controls[1];
    const startButton = controls[2];
    let nextButton = null;

    if (event.key === 'ArrowLeft') nextButton = bgmButton;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextButton = menuButton;
    if (event.key === 'ArrowDown') nextButton = startButton;

    if (!nextButton) return;
    event.preventDefault();
    closeInactiveSubmenus(nextButton);
    nextButton.focus();
}

/** Moves focus between BGM and Back to Menu in Menu Credits. */
function handleMenuCreditsArrowNavigation(event) {
    const controls = getMenuCreditsControls();
    if (!controls.includes(document.activeElement)) return;

    const bgmButton = controls[0];
    const backButton = controls[controls.length - 1];
    const isBgmDirection = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const nextButton = isBgmDirection ? bgmButton : backButton;

    event.preventDefault();
    closeInactiveSubmenus(nextButton);
    nextButton.focus();
}

/** Returns the scrollable content of the visible information dialog. */
function getScrollableDialogContent() {
    const dialogs = [
        ['infoDialog', '.dialog-content'],
        ['legalDialog', '.legal-content']
    ];
    const visibleDialog = dialogs.find(([id]) => {
        const dialog = document.getElementById(id);
        return dialog && !dialog.classList.contains('d-none');
    });

    if (!visibleDialog) return null;
    return document.getElementById(visibleDialog[0])?.querySelector(visibleDialog[1]);
}

/** Scrolls focused information text with the Up and Down arrow keys. */
function scrollDialogContent(event) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return false;

    const content = getScrollableDialogContent();
    if (!content || document.activeElement !== content) return false;

    const distance = Math.max(80, content.clientHeight * 0.7);
    content.scrollBy(0, event.key === 'ArrowDown' ? distance : -distance);
    event.preventDefault();
    return true;
}

/** Handles arrow-key navigation for start screen, Menu, BGM, and volume controls. */
function handleArrowNavigation(event) {
    const isArrowKey = isUiArrowKey(event.key);
    const isVerticalArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown';
    if (!isArrowKey) return;

    if (scrollDialogContent(event)) return;

    if (handleBgmMenuArrowNavigation(event)) return;

    if (handleUiArrowNavigation(event)) return;

    if (handleGameOverArrowNavigation(event)) return;

    const settings = document.getElementById('settingsDialog');
    if (settings && !settings.classList.contains('d-none') && isVerticalArrow) {
        moveMenuFocus(event, [
            document.getElementById('bgmSlider'),
            document.getElementById('sfxSlider')
        ].filter(Boolean));
        return;
    }

    const bgmMenu = document.getElementById('bgmMenu');

    if (isMenuCreditsOpen()) {
        handleMenuCreditsArrowNavigation(event);
        return;
    }

    const gameMenu = document.querySelector('.game-menu');
    if (gameMenu?.open && isVerticalArrow) {
        moveMenuFocus(event, getMenuButtons(gameMenu));
        return;
    }

    if (!bgmMenu?.open && !gameMenu?.open) handleStartScreenArrowNavigation(event);
}

/** Focuses Retry Level when available, otherwise Play Again. */
function focusGameOverButton(canRetry) {
    const buttonId = canRetry ? 'retryLevelBtn' : 'restartBtn';
    requestAnimationFrame(() => document.getElementById(buttonId)?.focus());
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
    keepFocusInControls(event, getFocusableControls(scope));
}

/** Keeps Tab navigation inside a supplied list of controls. */
function keepFocusInControls(event, controls) {
    if (event.key !== 'Tab') return;
    if (!controls.length) return;

    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    const isOutsideControls = !controls.includes(active);
    if (event.shiftKey && (active === first || isOutsideControls)) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (active === last || isOutsideControls)) {
        event.preventDefault();
        first.focus();
    }
}

/** Keeps keyboard focus out of background controls while a dialog is visible. */
function handleMenuFocus(event) {
    if (isMenuCreditsOpen()) {
        keepFocusInControls(event, getMenuCreditsControls());
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
    if (menu?.open) {
        keepFocusInScope(event, menu);
        return;
    }

    const startScreen = document.getElementById('startScreen');
    const bgmMenu = document.getElementById('bgmMenu');
    if (startScreen && !startScreen.classList.contains('d-none') && !bgmMenu?.open) {
        keepFocusInControls(event, getStartScreenControls());
    }
}

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

/** Keeps the native Menu dropdown and existing pause state in sync. */
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

/** Closes the dropdown for a selected action without resuming gameplay. */
function closeGameMenuForSelectedAction(event) {
    const menu = document.querySelector('.game-menu');
    if (!menu?.open || !event.target.closest('button')) return;

    menuCloseKeepsPause = true;
    menu.open = false;
}

/** Activates the focused UI button without letting gameplay input handle the key. */
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

/** Prevents held Enter or Space from repeatedly activating a focused UI button. */
function preventRepeatedUiActivation(event) {
    if (!event.repeat || !isUiNavigationActive()) return;
    if ((event.code === 'Enter' || event.code === 'Space') &&
        isMenuControlTarget(document.activeElement)) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}

/** Closes an open Menu from a blank outer area before gameplay input can run. */
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
 * @param {KeyboardEvent} event
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
