/** Returns whether the existing Menu dropdown is currently open. */
function isGameMenuOpen() {
    const menu = document.querySelector('.game-menu');
    return Boolean(menu && menu.open);
}

/**
 * Returns whether a native control should keep its own keyboard behavior.
 * @param {EventTarget|null} target The event target to inspect.
 * @returns {boolean} Whether the target is an interactive control.
 */
function isMenuControlTarget(target) {
    return target instanceof Element && Boolean(target.closest(
        'button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
    ));
}

/**
 * Returns visible, enabled controls inside a keyboard scope.
 * @param {Element|null} scope The element that contains the controls.
 * @returns {Element[]} Visible controls in DOM order.
 */
function getFocusableControls(scope) {
    if (!scope) return [];
    return Array.from(scope.querySelectorAll(
        'summary, button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(control => control.getClientRects().length > 0);
}

/**
 * Returns top-level controls available for current UI mode.
 * @returns {Element[]} Visible top-level controls.
 */
function getTopNavControls() {
    const bgmSummary = document.getElementById('bgmMenu')?.querySelector('summary');
    const gameMenuSummary = document.querySelector('.game-menu')?.querySelector('summary');
    const soundButton = document.getElementById('soundBtn');
    return [bgmSummary, soundButton, gameMenuSummary].filter(c => c && c.getClientRects().length > 0);
}

/**
 * Returns scoped overlay controls if any overlay is visible.
 * @returns {Element[]} Visible controls within active overlay.
 */
function getActiveScopeControls() {
    const activeScope = getVisibleDialog() || getVisibleOverlay();
    if (activeScope) return getFocusableControls(activeScope);
    return getStartScreenFallback();
}

/**
 * Returns the first visible modal dialog, if any.
 * @returns {Element|null} The open dialog element.
 */
function getVisibleDialog() {
    return ['settingsDialog', 'infoDialog', 'legalDialog']
        .map(id => document.getElementById(id))
        .find(dialog => dialog && !dialog.classList.contains('d-none')) || null;
}

/**
 * Returns the visible overlay screen, preferring the result screen.
 * @returns {Element|null} The visible overlay element.
 */
function getVisibleOverlay() {
    const overlays = Array.from(document.querySelectorAll(
        '.overlay-screen:not(.d-none), .story-video-screen:not(.d-none)'
    ));
    return overlays.find(o => o.id === 'restartScreen') ||
        overlays.find(o => o.getClientRects().length > 0) || null;
}

/**
 * Returns the start screen button when only the start screen is visible.
 * @returns {Element[]} The start button or an empty list.
 */
function getStartScreenFallback() {
    const startScreen = document.getElementById('startScreen');
    if (startScreen && !startScreen.classList.contains('d-none')) {
        return [document.getElementById('startBtn')];
    }
    return [];
}

/** Returns the visible controls available in the current non-gameplay UI. */
function getUiNavigationControls() {
    const gameMenu = document.querySelector('.game-menu');
    const bgmMenu = document.getElementById('bgmMenu');
    const topControls = getTopNavControls();
    const scopedControls = getActiveScopeControls();
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

/**
 * Moves focus through all controls visible in the current UI state.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @returns {boolean} Whether UI navigation handled the key.
 */
function handleUiArrowNavigation(event) {
    if (!isUiNavigationActive()) return false;
    const controls = getUiNavigationControls();
    const isHorizontalArrow = ['ArrowLeft', 'ArrowRight', 'Left', 'Right'].includes(event.key);
    if (!controls.length || document.activeElement?.matches('select, textarea') ||
        (isHorizontalArrow && document.activeElement?.matches('input[type="range"]'))) {
        return false;
    }
    moveMenuFocus(event, controls);
    event.stopImmediatePropagation();
    return true;
}

/**
 * Moves through the opened BGM menu before global UI navigation can leave it.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @returns {boolean} Whether BGM navigation handled the key.
 */
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
    const bgmMenu = document.getElementById('bgmMenu')?.querySelector('summary');
    const soundButton = document.getElementById('soundBtn');
    const gameMenu = document.querySelector('.game-menu summary');
    const backButton = document.getElementById('menuCreditsBackBtn');
    return [bgmMenu, soundButton, gameMenu, backButton]
        .filter(control => control && control.getClientRects().length > 0);
}

/**
 * Calculates the next index safely resolving wrap-around conditions.
 * @param {number} currentIndex The currently focused control index.
 * @param {number} direction The calculated index shift (-1 or 1).
 * @param {number} maxIndex The highest valid array index.
 * @returns {number} The safely wrapped index target.
 */
function calculateWrappedIndex(currentIndex, direction, maxIndex) {
    let nextIndex = currentIndex + direction;
    if (currentIndex === -1) return direction === 1 ? 0 : maxIndex;
    if (nextIndex < 0) return maxIndex;
    if (nextIndex > maxIndex) return 0;
    return nextIndex;
}

/**
 * Moves focus through a list of controls and wraps at both ends.
 * @param {KeyboardEvent} event The pressed arrow key.
 * @param {Element[]} controls The visible controls to navigate.
 */
function moveMenuFocus(event, controls) {
    if (!controls.length) return;
    let currentIndex = controls.indexOf(document.activeElement);
    let direction = ['ArrowDown', 'ArrowRight', 'Down', 'Right'].includes(event.key) ? 1 : -1;

    let nextIndex = calculateWrappedIndex(currentIndex, direction, controls.length - 1);
    event.preventDefault();
    const nextControl = controls[nextIndex];
    closeInactiveSubmenus(nextControl);
    nextControl.focus();
}

/**
 * Closes an open submenu only after keyboard focus leaves its controls.
 * @param {Element} nextControl The control receiving focus.
 */
function closeInactiveSubmenus(nextControl) {
    closeInactiveBgmMenu(nextControl);
    closeInactiveGameMenu(nextControl);
    closeInactiveDialogs(nextControl);
}

/**
 * Closes the BGM submenu once focus moves outside it.
 * @param {Element} nextControl The control receiving focus.
 */
function closeInactiveBgmMenu(nextControl) {
    const bgmMenu = document.getElementById('bgmMenu');
    if (bgmMenu?.open && !bgmMenu.contains(nextControl)) bgmMenu.open = false;
}

/**
 * Closes the game Menu once focus moves outside it.
 * @param {Element} nextControl The control receiving focus.
 */
function closeInactiveGameMenu(nextControl) {
    const gameMenu = document.querySelector('.game-menu');
    if (!gameMenu?.open || gameMenu.contains(nextControl)) return;
    menuCloseKeepsPause = true;
    gameMenu.open = false;
}

/**
 * Closes open modal dialogs that no longer contain the focused control.
 * @param {Element} nextControl The control receiving focus.
 */
function closeInactiveDialogs(nextControl) {
    ['settingsDialog', 'infoDialog', 'legalDialog'].forEach(id => {
        const dialog = document.getElementById(id);
        if (dialog && !dialog.classList.contains('d-none') && !dialog.contains(nextControl)) {
            dialog.classList.add('d-none');
        }
    });
}

/**
 * Returns whether a key represents one of the four UI navigation arrows.
 * @param {string} key The key value to test.
 * @returns {boolean} Whether the key is a UI navigation arrow.
 */
function isUiArrowKey(key) {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Up', 'Down', 'Left', 'Right'].includes(key);
}