/** Final ending reward sequence and its keyboard controls. */

let finalRunResult = null;
let endingStep = -1;
let endingTimer = null;
let endingDeadline = 0;
let endingPaused = false;

/** Stores the final run statistics for the ending sequence. */
function createFinalRunResult() {
    finalRunResult = { sombreros, totalCollectedCoins };
}

/**
 * Evaluates the conditions for the sombrero ending reward.
 * @param {number} count The earned sombrero amount.
 * @returns {Object|null} The video source object if conditions are met.
 */
function getSombreroEndingReward(count) {
    if (count >= 3) return { type: 'video', src: 'videos/golden-sombrero.mp4' };
    return null;
}

/**
 * Evaluates the conditions for the coin ending reward.
 * @param {number} count The total collected coins.
 * @returns {Object|null} The video source object if conditions are met.
 */
function getCoinEndingReward(count) {
    if (count >= 20) return { type: 'video', src: 'videos/golden-coins.mp4' };
    return null;
}

/** Applies the global mute and volume settings to the ending reward video. */
function syncEndingRewardVideoAudio() {
    let video = document.getElementById('endingRewardVideo');
    if (!video) return;
    video.muted = isMuted;
    video.volume = Math.min(1, sfxVolume * 0.65);
}

/**
 * Initiates video playback adhering to browser policies.
 * @param {HTMLVideoElement} video The video element to play.
 */
function playEndingRewardVideo(video) {
    syncEndingRewardVideoAudio();
    video.play().catch(() => {
        if (video.muted) return;
        video.muted = true;
        video.play().catch(() => { });
    });
}

/**
 * Initiates the ultimate victory ending flow.
 * @param {World} finishedWorld The final cleared world instance.
 */
function startFinalEnding(finishedWorld) {
    createFinalRunResult();
    playBgm(audioHub.bgmWin, true);
    endingStep = -1;
    endingPaused = false;
    showNextEndingStep(finishedWorld);
}

/**
 * Cycles to the next ending reward or finishes the ending sequence.
 * @param {World} finishedWorld The cleared world instance.
 */
function showNextEndingStep(finishedWorld) {
    let result = finalRunResult;
    if (!result || finishedWorld !== world) return;
    const cards = getEndingRewardCards(result);
    endingStep++;
    if (endingStep >= cards.length) {
        return finishEndingRewards(finishedWorld);
    }
    showEndingRewardCard(finishedWorld, cards[endingStep]);
}

/**
 * Assembles the applicable video rewards based on final statistics.
 * @param {Object} result The final run statistics.
 * @returns {Object[]} The array of earned video sources.
 */
function getEndingRewardCards(result) {
    return [
        getSombreroEndingReward(result.sombreros),
        getCoinEndingReward(result.totalCollectedCoins)
    ].filter(Boolean);
}

/**
 * Concludes the reward phase and opens the main credits screen.
 * @param {World} finishedWorld The cleared world instance.
 */
function finishEndingRewards(finishedWorld) {
    document.getElementById('endingRewardScreen').classList.add('d-none');
    finishedWorld.showEndScreen('', true);
}

/**
 * Displays one specific video reward card.
 * @param {World} finishedWorld The cleared world instance.
 * @param {Object} card The video source object to display.
 */
function showEndingRewardCard(finishedWorld, card) {
    let video = document.getElementById('endingRewardVideo');
    video.classList.remove('d-none');
    document.getElementById('endingRewardScreen').classList.remove('d-none');
    video.onended = () => advanceEndingStep(finishedWorld);
    video.onerror = () => advanceEndingStep(finishedWorld);
    video.src = card.src;
    video.load();
    playEndingRewardVideo(video);
    scheduleEndingStep(finishedWorld, 12000);
}

/**
 * Terminates current video playback and shifts to the next ending step.
 * @param {World} finishedWorld The cleared world instance.
 */
function advanceEndingStep(finishedWorld) {
    if (endingTimer) window.clearTimeout(endingTimer);
    endingTimer = null;
    let video = document.getElementById('endingRewardVideo');
    if (video) {
        video.onended = null;
        video.onerror = null;
        video.pause();
    }
    if (!endingPaused) showNextEndingStep(finishedWorld);
}

/**
 * Registers an automatic timeout to advance the ending flow.
 * @param {World} finishedWorld The cleared world instance.
 * @param {number} duration The pause duration in milliseconds.
 */
function scheduleEndingStep(finishedWorld, duration) {
    endingDeadline = Date.now() + duration;
    endingTimer = window.setTimeout(() => advanceEndingStep(finishedWorld), duration);
}

/**
 * Toggles the pause state specifically for the ending sequence.
 * @returns {boolean} True if the pause action was performed.
 */
function toggleEndingPause() {
    let rewardOpen = !document.getElementById('endingRewardScreen').classList.contains('d-none');
    let creditsOpen = !document.getElementById('endCredits').classList.contains('d-none');
    if (!rewardOpen && !creditsOpen) return false;
    endingPaused = !endingPaused;
    updateEndingPauseUi();
    if (endingPaused) pauseEndingPlayback();
    else resumeEndingPlayback(rewardOpen);
    return true;
}

/** Refreshes UI text and styling to reflect ending pause status. */
function updateEndingPauseUi() {
    document.getElementById('endingPauseBtn').textContent = endingPaused ? 'RESUME' : 'PAUSE';
    document.getElementById('endCredits').classList.toggle('credits-paused', endingPaused);
}

/** Freezes the ending timer and associated audio/video. */
function pauseEndingPlayback() {
    if (endingTimer) window.clearTimeout(endingTimer);
    endingTimer = null;
    endingDeadline = Math.max(0, endingDeadline - Date.now());
    if (currentBgm) currentBgm.pause();
    document.getElementById('endingRewardVideo')?.pause();
}

/**
 * Continues the frozen ending timer and multimedia playback.
 * @param {boolean} rewardOpen True if a reward card is currently shown.
 */
function resumeEndingPlayback(rewardOpen) {
    if (currentBgm) resumeCurrentBgm(true);
    if (!rewardOpen) return;
    let video = document.getElementById('endingRewardVideo');
    if (!video.classList.contains('d-none')) playEndingRewardVideo(video);
    scheduleEndingStep(world, endingDeadline);
}

/** Terminates the active ending flow completely. */
function cancelEndingSequence() {
    if (endingTimer) window.clearTimeout(endingTimer);
    endingTimer = null;
    endingStep = -1;
    endingPaused = false;
    let screen = document.getElementById('endingRewardScreen');
    if (screen) screen.classList.add('d-none');
    resetEndingRewardVideo();
}

/** Clears and purges the ending reward video tag. */
function resetEndingRewardVideo() {
    let video = document.getElementById('endingRewardVideo');
    if (!video) return;
    video.onended = null;
    video.onerror = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
}

/**
 * Handles toggling the ending pause state using the Space key.
 * @param {KeyboardEvent} event The pressed keyboard event.
 * @returns {boolean} True if the event was consumed for ending pause.
 */
function handleEndingPauseKey(event) {
    if (event.code !== 'Space' || event.repeat) return false;
    if (isMenuControlTarget(document.activeElement)) return false;
    if (processMenuCreditsBackKey(event)) return true;

    if (!toggleEndingPause()) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
}

/**
 * Manages the specific back button action during menu credits via keyboard.
 * @param {KeyboardEvent} event The pressed keyboard event.
 * @returns {boolean} True if the back operation was executed.
 */
function processMenuCreditsBackKey(event) {
    let backBtn = document.getElementById('menuCreditsBackBtn');
    if (backBtn && !backBtn.classList.contains('d-none')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeMenuCredits();
        return true;
    }
    return false;
}

/**
 * Consumes the Space key to proceed past the sombrero reward prompt.
 * @param {KeyboardEvent} event The pressed keyboard event.
 */
function handleSombreroRewardKey(event) {
    if (handleEndingPauseKey(event)) return;
    if (event.code !== 'Space' || event.repeat) return;
    let rewardScreen = document.getElementById('sombreroRewardScreen');
    if (rewardScreen && !rewardScreen.classList.contains('d-none')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        continueAfterSombrero();
    }
}
document.addEventListener('keydown', handleSombreroRewardKey, true);
