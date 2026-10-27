/** Toggles the game's pause state. */
function togglePause() {
    if (typeof isGameResultVisible === 'function' && isGameResultVisible()) {
        setGameMenuOpen(false);
        return;
    }
    if (!world || pendingLevelNumber !== null) return;
    if (world.gameEnded) {
        setGameMenuOpen(false);
        return;
    }

    const wasPaused = isPaused;
    if (!isPaused) {
        pauseStartedAt = Date.now();
        pauseBossAttackTimers();
        isPaused = true;
    } else {
        let pausedFor = Date.now() - pauseStartedAt;
        isPaused = false;
        shiftPausedGameplayTimes(pausedFor);
        resumeBossAttackTimers();
        pauseStartedAt = 0;
    }
    updatePauseUI();
    handlePauseAudio();

    if (wasPaused && document.activeElement === document.getElementById('resumeBtn')) {
        document.activeElement.blur();
    }

    if (wasPaused && typeof isGameMenuOpen === 'function' && isGameMenuOpen()) {
        setGameMenuOpen(false);
    }
}

/** Pauses pending Endboss attack phases without changing their remaining time. */
function pauseBossAttackTimers() {
    let boss = world?.level.enemies.find(enemy => enemy instanceof Endboss);
    boss?.pauseSpecialAttack();
}

/** Restarts a paused Endboss attack phase with its remaining delay. */
function resumeBossAttackTimers() {
    let boss = world?.level.enemies.find(enemy => enemy instanceof Endboss);
    boss?.resumeSpecialAttack();
}

/** Keeps gameplay cooldowns and temporary protection from expiring during Pause. */
function shiftPausedGameplayTimes(pausedFor) {
    if (!world || pausedFor <= 0) return;

    let character = world.character;
    shiftPauseTime(character, 'lastActionTime', pausedFor);
    shiftPauseTime(character, 'lastHit', pausedFor);
    shiftPauseTime(character, 'lastLandingTime', pausedFor);
    shiftPauseTime(character, 'stompBounceUntil', pausedFor);
    shiftPauseTime(character, 'reviveProtectionUntil', pausedFor);

    (character.lastFallSteps || []).forEach(step => {
        shiftPauseTime(step, 'time', pausedFor);
    });
    shiftPauseTime(character.lastFallStep, 'time', pausedFor);

    world.level.enemies.forEach(enemy => {
        shiftPauseTime(enemy, 'lastHit', pausedFor);
        shiftPauseTime(enemy, 'lastStomp', pausedFor);
        shiftPauseTime(enemy, 'lastStompBounce', pausedFor);
        shiftPauseTime(enemy, 'lastSpecialAttack', pausedFor);
    });
}

/** Moves one existing timestamp forward by the paused duration. */
function shiftPauseTime(target, property, pausedFor) {
    if (target && Number.isFinite(target[property]) && target[property] > 0) {
        target[property] += pausedFor;
    }
}

/** Updates pause screen and button text. */
function updatePauseUI() {
    const screen = document.getElementById('pauseScreen');
    const button = document.getElementById('pauseBtn');

    if (screen) screen.classList.toggle('d-none', !isPaused);

    if (button) {
        button.innerText = isPaused ? 'Resume' : 'Pause';
    }
}

/** Pauses or resumes game audio. */
function handlePauseAudio() {
    if (isPaused) {
        if (currentBgm) currentBgm.pause();
        stopSoundEffects();
        return;
    }

    resumeCurrentBgm();
}

/** Resets the pause state. */
function resetPauseState() {
    isPaused = false;
    pauseStartedAt = 0;
    updatePauseUI();
}

/**
 * Initializes and starts the selected level.
 * @param {number} levelNumber
 */
function startLevel(levelNumber) {
    if (levelNumber < 1 || levelNumber > 5) return;

    if (world) world.stopDrawing = true;

    stopAllIntervals();
    stopSoundEffects();

    playBgm(AUDIO_HUB.bgmGame);

    showLevelRules(levelNumber);
}

/** Creates a fresh world only after the player accepts the rules. */
function beginLevel(levelNumber) {
    if (levelNumber === 1) initLevel();
    else if (levelNumber === 2) initLevel2();
    else if (levelNumber === 3) initLevel3();
    else if (levelNumber === 4) initLevel4();
    else if (levelNumber === 5) initLevel5();

    removeCollectedCoins(levelNumber);
    resetPauseState();

    world = new World(canvas, keyboard, levelNumber);
    world.draw();

    if (currentBgm !== AUDIO_HUB.bgmGame) {
        playBgm(AUDIO_HUB.bgmGame);
    }
}

/** Starts a new game at Level 1. */
function startGame() {
    stopSoundEffects();
    resetPauseState();
    keyboard = new Keyboard();

    stopStartVideo();
    document.getElementById('startControls')?.classList.add('d-none');
    document.getElementById('startScreen').classList.add('d-none');

    deactivatePlaylist();
    resetSombreroGame();
    playStoryVideo(1, () => startLevel(1));
}

/** Clears the existing game intervals. */
function stopAllIntervals() {
    for (let i = 1; i < 9999; i++) {
        window.clearInterval(i);
    }
}

/** Restarts the game from Level 1. */
function restartGame() {
    stopSoundEffects();
    resetPauseState();
    keyboard = new Keyboard();

    stopEndVideo();
    cancelEndingSequence();

    document.getElementById('restartScreen').classList.add('d-none');
    document.getElementById('endCredits').classList.add('d-none');

    resetSombreroGame();
    startLevel(1);
}

/** Returns to the start screen. */
function backToMainMenu() {
    closeGameOverlays();
    cancelEndingSequence();

    // Stop rendering the active world.
    if (world) {
        world.stopDrawing = true;
    }

    stopAllIntervals();
    stopSoundEffects();

    document.getElementById('startControls')?.classList.remove('d-none');
    document.getElementById('startScreen').classList.remove('d-none');
    resetStartScreenMenuState();

    playStartVideo();

    world = null;
    resetPlaylist();
}

/** Closes menu panels and returns keyboard focus to Start Game. */
function resetStartScreenMenuState() {
    document.querySelector('.game-menu').open = false;
    document.getElementById('bgmMenu').open = false;
    requestAnimationFrame(focusStartGameButton);
}

/** Focuses Start Game when the initial screen becomes available. */
function focusStartGameButton() {
    const startButton = document.getElementById('startBtn');
    startButton?.classList.add('is-keyboard-selected');
    startButton?.focus();
}

/** Closes game overlays and cancels their pending continue actions. */
function closeGameOverlays() {
    cancelLevelRules();
    cancelSombreroReward();
    cancelStoryVideo();
    stopEndVideo();
    cancelEndingSequence();
    resetPauseState();

    ['restartScreen', 'settingsDialog', 'infoDialog', 'legalDialog'].forEach(id => {
        document.getElementById(id).classList.add('d-none');
    });
}
