/**
 * Returns the visible existing actions shown after a game ends.
 * @returns {HTMLElement[]} The visible result screen buttons.
 */
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

/**
 * Returns the three visible controls on the start screen.
 * @returns {HTMLElement[]} The start screen controls.
 */
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
    const nextButton = getStartScreenNextControl(event, controls);
    if (!nextButton) return;
    event.preventDefault();
    closeInactiveSubmenus(nextButton);
    nextButton.focus();
}

/**
 * Returns the start-screen control the pressed arrow key targets.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @param {Element[]} controls The visible start-screen controls.
 * @returns {Element|null} The next control, if any.
 */
function getStartScreenNextControl(event, controls) {
    if (event.key === 'ArrowLeft') return controls[0];
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') return controls[1];
    if (event.key === 'ArrowDown') return controls[2];
    return null;
}

/**
 * Moves focus between the available controls in Menu Credits.
 * @param {KeyboardEvent} event The pressed arrow key.
 */
function handleMenuCreditsArrowNavigation(event) {
    const controls = getMenuCreditsControls();
    if (!controls.includes(document.activeElement)) return;

    moveMenuFocus(event, controls);
}

/**
 * Returns the scrollable content of the visible information dialog.
 * @returns {HTMLElement|null} The scrollable content element, or null.
 */
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
    const isVerticalArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown';
    if (!isUiArrowKey(event.key)) return;
    if (handleGlobalArrowNavigation(event)) return;
    if (isVerticalArrow && handleSettingsArrowNavigation(event)) return;
    if (handleCreditsAndMenuArrowNavigation(event, isVerticalArrow)) return;
    handleStartScreenArrowNavigationWhenClosed(event);
}

/**
 * Runs dialog, BGM, UI, and result arrow handlers in their original order.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @returns {boolean} Whether a handler consumed the key.
 */
function handleGlobalArrowNavigation(event) {
    if (scrollDialogContent(event)) return true;
    if (handleBgmMenuArrowNavigation(event)) return true;
    if (handleUiArrowNavigation(event)) return true;
    return handleGameOverArrowNavigation(event);
}

/**
 * Moves focus between the two volume sliders.
 * @param {KeyboardEvent} event The pressed vertical arrow key.
 * @returns {boolean} Whether the settings dialog consumed the key.
 */
function handleSettingsArrowNavigation(event) {
    const settings = document.getElementById('settingsDialog');
    if (!settings || settings.classList.contains('d-none')) return false;
    const sliders = [
        document.getElementById('bgmSlider'),
        document.getElementById('sfxSlider')
    ].filter(Boolean);
    moveMenuFocus(event, sliders);
    return true;
}

/**
 * Moves focus inside Menu Credits or the open gameplay Menu.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @param {boolean} isVerticalArrow Whether the key is Up or Down.
 * @returns {boolean} Whether credits or the Menu consumed the key.
 */
function handleCreditsAndMenuArrowNavigation(event, isVerticalArrow) {
    if (isMenuCreditsOpen()) {
        handleMenuCreditsArrowNavigation(event);
        return true;
    }
    const gameMenu = document.querySelector('.game-menu');
    if (gameMenu?.open && isVerticalArrow) {
        moveMenuFocus(event, getMenuButtons(gameMenu));
        return true;
    }
    return false;
}

/**
 * Moves start-screen focus when no dropdown is open.
 * @param {KeyboardEvent} event The pressed arrow key.
 */
function handleStartScreenArrowNavigationWhenClosed(event) {
    const bgmMenu = document.getElementById('bgmMenu');
    const gameMenu = document.querySelector('.game-menu');
    if (bgmMenu?.open || gameMenu?.open) return;
    handleStartScreenArrowNavigation(event);
}

/**
 * Focuses Retry Level when available, otherwise Play Again.
 * @param {boolean} canRetry True if Retry Level is available.
 */
function focusGameOverButton(canRetry) {
    const buttonId = canRetry ? 'retryLevelBtn' : 'restartBtn';
    requestAnimationFrame(() => document.getElementById(buttonId)?.focus());
}

/**
 * Moves focus to the first visible existing Menu control.
 */
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
    const target = getWrappedFocusTarget(event, controls);
    if (!target) return;
    event.preventDefault();
    target.focus();
}

/**
 * Returns the control that should receive wrapped Tab focus.
 * @param {KeyboardEvent} event The pressed Tab key.
 * @param {Element[]} controls The controls allowed to receive focus.
 * @returns {Element|null} The wrapped focus target, if any.
 */
function getWrappedFocusTarget(event, controls) {
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    const isOutsideControls = !controls.includes(active);
    if (event.shiftKey && (active === first || isOutsideControls)) return last;
    if (!event.shiftKey && (active === last || isOutsideControls)) return first;
    return null;
}

/**
 * Keeps keyboard focus out of background controls while a dialog is visible.
 * @param {KeyboardEvent} event The pressed keyboard event.
 */
function handleMenuFocus(event) {
    if (isMenuCreditsOpen()) return keepFocusInControls(event, getMenuCreditsControls());
    const visibleDialog = getVisibleFocusDialog();
    if (visibleDialog) return keepFocusInScope(event, visibleDialog.querySelector('.dialog-card'));
    const menu = document.querySelector('.game-menu');
    if (menu?.open) return keepFocusInScope(event, menu);
    focusStartScreenControls(event);
}

/**
 * Returns the first visible settings, info, or legal dialog.
 * @returns {HTMLElement|undefined} The visible dialog, or undefined.
 */
function getVisibleFocusDialog() {
    return ['settingsDialog', 'infoDialog', 'legalDialog']
        .map(id => document.getElementById(id))
        .find(dialog => dialog && !dialog.classList.contains('d-none'));
}

/**
 * Keeps focus inside the start screen when no dropdown is open.
 * @param {KeyboardEvent} event The pressed keyboard event.
 */
function focusStartScreenControls(event) {
    const startScreen = document.getElementById('startScreen');
    const bgmMenu = document.getElementById('bgmMenu');
    if (!startScreen || startScreen.classList.contains('d-none') || bgmMenu?.open) return;
    keepFocusInControls(event, getStartScreenControls());
}