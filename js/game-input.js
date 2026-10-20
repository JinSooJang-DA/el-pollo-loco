
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
    if (property) keyboard[property] = pressed;
    if (event.keyCode === 32 && pressed) event.preventDefault();
}

/**
 * Starts the game using Enter or Space.
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
function handleStartKey(event) {
    const startScreen = document.getElementById('startScreen');
    if (startScreen.classList.contains('d-none')) return false;
    if (event.code !== 'Enter' && event.code !== 'Space') return false;
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
