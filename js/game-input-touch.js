/**
 * Connects a button to touch input.
 * @param {string} btnId The touch button element ID.
 * @param {string} keyProperty The matching Keyboard state property.
 */
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

/**
 * Activates a touch control.
 * @param {TouchEvent} event The touch start event.
 * @param {string} keyProperty The Keyboard state property to activate.
 */
function handleTouchStart(event, keyProperty) {
    event.preventDefault();
    if (isStoryVideoPlaying()) return;
    keyboard[keyProperty] = true;
    if (keyProperty === 'SPACE') return processTouchJump();
    if (keyProperty === 'D') return processTouchThrow();
}

/**
 * Triggers the jump action via touch controls.
 */
function processTouchJump() {
    keyboard.SPACE = false;
    if (world && !isPaused && !world.gameEnded &&
        !world.character.isDead() && !world.character.isAboveGround()) {
        world.character.resetIdleTimer();
        world.character.jump();
    }
}

/**
 * Triggers the bottle throw action via touch controls.
 */
function processTouchThrow() {
    if (world && !isPaused) {
        world.character.resetIdleTimer();
        world.checkThrowObjects();
        keyboard.D = false;
    }
}

/**
 * Releases a touch control.
 * @param {TouchEvent} event The touch end or cancel event.
 * @param {string} keyProperty The Keyboard state property to clear.
 */
function handleTouchEnd(event, keyProperty) {
    event.preventDefault();
    keyboard[keyProperty] = false;
}

/**
 * Connects all mobile touch buttons.
 */
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

/**
 * Releases active touch input when rotation, resizing, or app switching cancels it.
 */
function clearTouchControlState() {
    keyboard.LEFT = false;
    keyboard.RIGHT = false;
    keyboard.SPACE = false;
    keyboard.D = false;
}

/**
 * Updates the keyboard state.
 * @param {KeyboardEvent} event The keyboard event to process.
 * @param {boolean} pressed Whether the key was pressed or released.
 */
function updateKeyboardState(event, pressed) {
    if (isStoryVideoPlaying()) return;
    const keyMap = {
        39: 'RIGHT', 37: 'LEFT', 38: 'UP', 40: 'DOWN', 32: 'SPACE', 68: 'D'
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