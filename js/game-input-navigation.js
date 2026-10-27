/** Returns the visible existing actions shown after a game ends. */
function getGameOverButtons() {
    const restartScreen = document.getElementById('restartScreen');
    if (!restartScreen || restartScreen.classList.contains('d-none')) return [];

    return ['retryLevelBtn', 'restartBtn', 'homeBtn']
        .map(id => document.getElementById(id))
        .filter(button => button && button.getClientRects().length > 0);
}

/**
 * Moves between result actions without changing their click behavior.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @returns {boolean} Whether result navigation handled the key.
 */
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

/**
 * Keeps the visible Start Game selection aligned with start-screen navigation.
 * @param {Element} target The newly focused control.
 */
function syncStartScreenSelection(target) {
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startBtn');
    if (!startScreen || startScreen.classList.contains('d-none') || !startButton) return;

    startButton.classList.toggle('is-keyboard-selected', target === startButton);
}

/**
 * Moves focus between the BGM, Menu, and Start Game controls.
 * @param {KeyboardEvent} event The pressed arrow key.
 */
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

/**
 * Moves focus between BGM and Back to Menu in Menu Credits.
 * @param {KeyboardEvent} event The pressed arrow key.
 */
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

/**
 * Scrolls focused information text with the Up and Down arrow keys.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @returns {boolean} Whether dialog scrolling handled the key.
 */
function scrollDialogContent(event) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return false;

    const content = getScrollableDialogContent();
    if (!content || document.activeElement !== content) return false;

    const distance = Math.max(80, content.clientHeight * 0.7);
    content.scrollBy(0, event.key === 'ArrowDown' ? distance : -distance);
    event.preventDefault();
    return true;
}

/**
 * Handles arrow-key navigation for start screen, Menu, BGM, and volume controls.
 * @param {KeyboardEvent} event The pressed arrow key.
 */
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

/**
 * Keeps Tab navigation within an open Menu or dialog.
 * @param {KeyboardEvent} event The pressed keyboard event.
 * @param {Element} scope The open Menu or dialog scope.
 */
function keepFocusInScope(event, scope) {
    keepFocusInControls(event, getFocusableControls(scope));
}

/**
 * Keeps Tab navigation inside a supplied list of controls.
 * @param {KeyboardEvent} event The pressed keyboard event.
 * @param {Element[]} controls The controls allowed to receive focus.
 */
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

/**
 * Keeps keyboard focus out of background controls while a dialog is visible.
 * @param {KeyboardEvent} event The pressed keyboard event.
 */
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

