
/** Sombrero rewards and level retries. */

let sombreros = 0;
let collectedCoinsByLevel = {};
let rewardNextLevel = null;
let totalCollectedCoins = 0;
let finalRunResult = null;
let endingStep = -1;
let endingTimer = null;
let endingDeadline = 0;
let endingPaused = false;

/** Starts a completely new game. */
function resetSombreroGame() {
    sombreros = 0;
    collectedCoinsByLevel = {};
    rewardNextLevel = null;
    totalCollectedCoins = 0;
    finalRunResult = null;
    cancelEndingSequence();
    updateSombreroCounter();
    updateCollectedCoinCounter();
}

/** Shows one existing in-game sombrero icon for each earned revive. */
function updateSombreroCounter() {
    let counter = document.getElementById('sombreroCounter');
    if (!counter) return;

    counter.innerHTML = '';

    for (let i = 0; i < sombreros; i++) {
        counter.appendChild(createSombreroIcon());
    }
}

/** Creates one existing in-game sombrero icon. */
function createSombreroIcon() {
    let hat = document.createElement('img');
    hat.src = 'img/golden-sombrero-big.webp';
    hat.className = 'sombrero-icon';
    hat.alt = 'Sombrero';
    hat.title = 'Extra life';
    return hat;
}

/** Updates the run-wide coin statistic without changing defense coins. */
function updateCollectedCoinCounter() {
    let counter = document.getElementById('coinCollectedCounter');
    if (counter) counter.innerHTML =
        '<img src="img/coin-full.webp" alt="Coin">' +
        '<span>× ' + totalCollectedCoins + '</span>';
}

/** Records one physical coin pickup for the current run. */
function recordCollectedCoin() {
    totalCollectedCoins++;
    updateCollectedCoinCounter();
}

/** Remembers a collected coin, even if it healed Pepe. */
function rememberCollectedCoin(levelNumber, coin) {
    if (!collectedCoinsByLevel[levelNumber]) {
        collectedCoinsByLevel[levelNumber] = [];
    }

    let positions = collectedCoinsByLevel[levelNumber];

    if (!positions.includes(coin.x)) {
        positions.push(coin.x);
    }
}

/** Removes previously collected coins when retrying a level. */
function removeCollectedCoins(levelNumber) {
    let levels = [level1, level2, level3, level4, level5];
    let currentLevel = levels[levelNumber - 1];
    let collected = collectedCoinsByLevel[levelNumber] || [];

    currentLevel.coins = currentLevel.coins.filter(coin => {
        return !collected.includes(coin.x);
    });
}

/** Continues the completed level after its story chapter. */
function finishCompletedLevel(finishedWorld) {
    let nextLevel = finishedWorld.levelNumber + 1;

    if (finishedWorld.levelNumber === 5) {
        return finishFinalLevel(finishedWorld);
    }

    playStoryVideo(nextLevel, () => {
        showCompletedLevelResult(finishedWorld, nextLevel);
    });
}

/** Awards the perfect-health sombrero and starts the final chapter. */
function finishFinalLevel(finishedWorld) {
    if (finishedWorld.character.energy === 100) {
        sombreros++;
        updateSombreroCounter();
    }

    playStoryVideo(6, () => {
        if (finishedWorld === world) {
            startFinalEnding(finishedWorld);
        }
    });
}

/** Shows a completed-level reward or the next level rules. */
function showCompletedLevelResult(finishedWorld, nextLevel) {
    if (finishedWorld !== world) return;

    if (finishedWorld.levelNumber !== 1 &&
        finishedWorld.character.energy === 100) {
        return showSombreroReward(nextLevel);
    }

    startLevel(nextLevel);
}

/** Awards a sombrero and shows the existing reward screen. */
function showSombreroReward(nextLevel) {
    sombreros++;
    updateSombreroCounter();

    rewardNextLevel = nextLevel;

    document.getElementById('sombreroRewardScreen')
        .classList.remove('d-none');
    playBgm(AUDIO_HUB.bgmGame);
}

/** Continues after the reward screen. */
function continueAfterSombrero() {
    document.getElementById('sombreroRewardScreen')
        .classList.add('d-none');

    let nextLevel = rewardNextLevel;
    rewardNextLevel = null;

    if (nextLevel !== null) startLevel(nextLevel);
}

/** Closes a pending reward without advancing to the next level. */
function cancelSombreroReward() {
    document.getElementById('sombreroRewardScreen')
        .classList.add('d-none');
    rewardNextLevel = null;
}

/** Uses one sombrero to revive in the same world and keep level progress. */
function retryCurrentLevel() {
    if (!world || !world.gameEnded || sombreros < 1) return;
    if (!world.character.isDead()) return;

    sombreros--;
    updateSombreroCounter();
    document.getElementById('restartScreen').classList.add('d-none');

    reviveCharacter(world.character);
    reviveWorld(world);
    let boss = world.level.enemies.find(enemy => enemy instanceof Endboss);
    playBgm(boss?.hadFirstContact ? AUDIO_HUB.bgmBoss : AUDIO_HUB.bgmGame);
    showReviveMessage();
}

/** Restores Pepe's health and movement after a sombrero revival. */
function reviveCharacter(character) {
    character.energy = 100;
    character.lastHit = 0;
    character.deadFrameIndex = 0;
    character.speedY = 0;
    character.resetIdleTimer();
    character.reviveProtectionUntil = Date.now() + 5000;
}

/** Restarts the active world after a sombrero revival. */
function reviveWorld(activeWorld) {
    activeWorld.canThrow = true;
    activeWorld.statusBar.setPercentage(100);
    activeWorld.gameEnded = false;
    activeWorld.stopDrawing = false;
}

/** Returns whether Pepe is still protected after a sombrero revival. */
function hasReviveProtection(character) {
    return Boolean(character && Date.now() < (character.reviveProtectionUntil || 0));
}

/** Shows a short non-blocking revival confirmation. */
function showReviveMessage() {
    let message = document.getElementById('reviveMessage');
    if (!message) {
        message = document.createElement('div');
        message.id = 'reviveMessage';
        message.className = 'revive-message';
        document.getElementById('gameContainer').appendChild(message);
    }

    message.textContent = 'SOMBRERO SAVED YOU!';
    message.classList.add('is-visible');
    window.setTimeout(() => message.classList.remove('is-visible'), 1800);
}

/** Stores the final run values once, before ending screens begin. */
function createFinalRunResult() {
    finalRunResult = { sombreros, totalCollectedCoins };
}

/** Returns the earned sombrero reward media, if the final record qualifies. */
function getSombreroEndingReward(count) {
    if (count >= 3) return { type: 'video', src: 'videos/golden-sombrero.mp4' };
    return null;
}

/** Returns the earned coin reward media, if the collected total qualifies. */
function getCoinEndingReward(count) {
    if (count >= 20) return { type: 'video', src: 'videos/golden-coins.mp4' };
    return null;
}

/** Applies the game's SFX preferences to a playing ending reward video. */
function syncEndingRewardVideoAudio() {
    let video = document.getElementById('endingRewardVideo');
    if (!video) return;

    video.muted = isMuted;
    video.volume = Math.min(1, sfxVolume * 0.65);
}

/** Plays reward video sound when permitted, then safely falls back to muted video. */
function playEndingRewardVideo(video) {
    syncEndingRewardVideoAudio();

    video.play().catch(() => {
        if (video.muted) return;
        video.muted = true;
        video.play().catch(() => { });
    });
}

/** Starts the final automatic rewards before the existing credits. */
function startFinalEnding(finishedWorld) {
    createFinalRunResult();
    playBgm(AUDIO_HUB.bgmWin, true);
    endingStep = -1;
    endingPaused = false;
    showNextEndingStep(finishedWorld);
}

/** Shows only the final reward videos that were earned. */
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

/** Returns the earned reward cards in their display order. */
function getEndingRewardCards(result) {
    return [
        getSombreroEndingReward(result.sombreros),
        getCoinEndingReward(result.totalCollectedCoins)
    ].filter(Boolean);
}

/** Shows the existing victory screen once all rewards are done. */
function finishEndingRewards(finishedWorld) {
    document.getElementById('endingRewardScreen').classList.add('d-none');
    finishedWorld.showEndScreen('', true);
}

/** Plays one reward card and schedules its automatic advance. */
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

/** Advances once, whether the reward ended naturally or its media failed. */
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

/** Schedules a remaining ending-card duration so it can be paused. */
function scheduleEndingStep(finishedWorld, duration) {
    endingDeadline = Date.now() + duration;
    endingTimer = window.setTimeout(() => advanceEndingStep(finishedWorld), duration);
}

/** Pauses or resumes ending cards and the existing credits without restarting BGM. */
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

/** Updates the ending pause button and credits styling. */
function updateEndingPauseUi() {
    document.getElementById('endingPauseBtn').textContent = endingPaused ? 'RESUME' : 'PAUSE';
    document.getElementById('endCredits').classList.toggle('credits-paused', endingPaused);
}

/** Freezes ending timers, music, and video playback. */
function pauseEndingPlayback() {
    if (endingTimer) window.clearTimeout(endingTimer);
    endingTimer = null;
    endingDeadline = Math.max(0, endingDeadline - Date.now());
    if (currentBgm) currentBgm.pause();
    document.getElementById('endingRewardVideo')?.pause();
}

/** Resumes ending timers, music, and the visible reward video. */
function resumeEndingPlayback(rewardOpen) {
    if (currentBgm) resumeCurrentBgm(true);
    if (!rewardOpen) return;

    let video = document.getElementById('endingRewardVideo');
    if (!video.classList.contains('d-none')) {
        playEndingRewardVideo(video);
    }
    scheduleEndingStep(world, endingDeadline);
}

/** Cancels pending reward timers when a run is abandoned. */
function cancelEndingSequence() {
    if (endingTimer) window.clearTimeout(endingTimer);
    endingTimer = null;
    endingStep = -1;
    endingPaused = false;

    let screen = document.getElementById('endingRewardScreen');
    if (screen) screen.classList.add('d-none');
    resetEndingRewardVideo();
}

/** Stops and unloads the ending reward video. */
function resetEndingRewardVideo() {
    let video = document.getElementById('endingRewardVideo');
    if (!video) return;

    video.onended = null;
    video.onerror = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
}

/** Toggles the ending pause with Space when the credits are not open. */
function handleEndingPauseKey(event) {
    if (event.code !== 'Space' || event.repeat) return false;
    let backButton = document.getElementById('menuCreditsBackBtn');
    if (!backButton?.classList.contains('d-none')) return false;
    if (!toggleEndingPause()) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
}

/** Continue the sombrero reward screen with Space. */
document.addEventListener('keydown', function (event) {
    if (handleEndingPauseKey(event)) return;
    if (event.code !== 'Space' || event.repeat) return;

    let rewardScreen = document.getElementById('sombreroRewardScreen');

    if (rewardScreen && !rewardScreen.classList.contains('d-none')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        continueAfterSombrero();
    }
}, true);
