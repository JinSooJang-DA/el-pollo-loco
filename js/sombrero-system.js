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

function updateSombreroCounter() {
    let counter = document.getElementById('sombreroCounter');
    if (!counter) return;
    counter.innerHTML = '';
    for (let i = 0; i < sombreros; i++) {
        counter.appendChild(createSombreroIcon());
    }
}

function createSombreroIcon() {
    let hat = document.createElement('img');
    hat.src = 'img/golden-sombrero-big.webp';
    hat.className = 'sombrero-icon';
    hat.alt = 'Sombrero';
    hat.title = 'Extra life';
    return hat;
}

function updateCollectedCoinCounter() {
    let counter = document.getElementById('coinCollectedCounter');
    if (counter) counter.innerHTML =
        '<img src="img/coin-full.webp" alt="Coin">' +
        '<span>× ' + totalCollectedCoins + '</span>';
}

function recordCollectedCoin() {
    totalCollectedCoins++;
    updateCollectedCoinCounter();
}

function rememberCollectedCoin(levelNumber, coin) {
    if (!collectedCoinsByLevel[levelNumber]) {
        collectedCoinsByLevel[levelNumber] = [];
    }
    let positions = collectedCoinsByLevel[levelNumber];
    if (!positions.includes(coin.x)) positions.push(coin.x);
}

function removeCollectedCoins(levelNumber) {
    let levels = [level1, level2, level3, level4, level5];
    let currentLevel = levels[levelNumber - 1];
    let collected = collectedCoinsByLevel[levelNumber] || [];
    currentLevel.coins = currentLevel.coins.filter(coin => {
        return !collected.includes(coin.x);
    });
}

function finishCompletedLevel(finishedWorld) {
    let nextLevel = finishedWorld.levelNumber + 1;
    if (finishedWorld.levelNumber === 5) {
        return finishFinalLevel(finishedWorld);
    }
    playStoryVideo(nextLevel, () => {
        showCompletedLevelResult(finishedWorld, nextLevel);
    });
}

function finishFinalLevel(finishedWorld) {
    if (finishedWorld.character.energy === 100) {
        sombreros++;
        updateSombreroCounter();
    }
    playStoryVideo(6, () => {
        if (finishedWorld === world) startFinalEnding(finishedWorld);
    });
}

function showCompletedLevelResult(finishedWorld, nextLevel) {
    if (finishedWorld !== world) return;
    if (finishedWorld.levelNumber !== 1 &&
        finishedWorld.character.energy === 100) {
        return showSombreroReward(nextLevel);
    }
    startLevel(nextLevel);
}

function showSombreroReward(nextLevel) {
    sombreros++;
    updateSombreroCounter();
    rewardNextLevel = nextLevel;
    document.getElementById('sombreroRewardScreen').classList.remove('d-none');
    playBgm(AUDIO_HUB.bgmGame);
}

function continueAfterSombrero() {
    document.getElementById('sombreroRewardScreen').classList.add('d-none');
    let nextLevel = rewardNextLevel;
    rewardNextLevel = null;
    if (nextLevel !== null) startLevel(nextLevel);
}

function cancelSombreroReward() {
    document.getElementById('sombreroRewardScreen').classList.add('d-none');
    rewardNextLevel = null;
}

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

function reviveCharacter(character) {
    character.energy = 100;
    character.lastHit = 0;
    character.deadFrameIndex = 0;
    character.speedY = 0;
    character.resetIdleTimer();
    character.reviveProtectionUntil = Date.now() + 5000;
}

function reviveWorld(activeWorld) {
    activeWorld.canThrow = true;
    activeWorld.statusBar.setPercentage(100);
    activeWorld.gameEnded = false;
    activeWorld.stopDrawing = false;
}

function hasReviveProtection(character) {
    return Boolean(character && Date.now() < (character.reviveProtectionUntil || 0));
}

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

function createFinalRunResult() {
    finalRunResult = { sombreros, totalCollectedCoins };
}

function getSombreroEndingReward(count) {
    if (count >= 3) return { type: 'video', src: 'videos/golden-sombrero.mp4' };
    return null;
}

function getCoinEndingReward(count) {
    if (count >= 20) return { type: 'video', src: 'videos/golden-coins.mp4' };
    return null;
}

function syncEndingRewardVideoAudio() {
    let video = document.getElementById('endingRewardVideo');
    if (!video) return;
    video.muted = isMuted;
    video.volume = Math.min(1, sfxVolume * 0.65);
}

function playEndingRewardVideo(video) {
    syncEndingRewardVideoAudio();
    video.play().catch(() => {
        if (video.muted) return;
        video.muted = true;
        video.play().catch(() => { });
    });
}

function startFinalEnding(finishedWorld) {
    createFinalRunResult();
    playBgm(AUDIO_HUB.bgmWin, true);
    endingStep = -1;
    endingPaused = false;
    showNextEndingStep(finishedWorld);
}

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

function getEndingRewardCards(result) {
    return [
        getSombreroEndingReward(result.sombreros),
        getCoinEndingReward(result.totalCollectedCoins)
    ].filter(Boolean);
}

function finishEndingRewards(finishedWorld) {
    document.getElementById('endingRewardScreen').classList.add('d-none');
    finishedWorld.showEndScreen('', true);
}

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

function scheduleEndingStep(finishedWorld, duration) {
    endingDeadline = Date.now() + duration;
    endingTimer = window.setTimeout(() => advanceEndingStep(finishedWorld), duration);
}

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

function updateEndingPauseUi() {
    document.getElementById('endingPauseBtn').textContent = endingPaused ? 'RESUME' : 'PAUSE';
    document.getElementById('endCredits').classList.toggle('credits-paused', endingPaused);
}

function pauseEndingPlayback() {
    if (endingTimer) window.clearTimeout(endingTimer);
    endingTimer = null;
    endingDeadline = Math.max(0, endingDeadline - Date.now());
    if (currentBgm) currentBgm.pause();
    document.getElementById('endingRewardVideo')?.pause();
}

function resumeEndingPlayback(rewardOpen) {
    if (currentBgm) resumeCurrentBgm(true);
    if (!rewardOpen) return;
    let video = document.getElementById('endingRewardVideo');
    if (!video.classList.contains('d-none')) playEndingRewardVideo(video);
    scheduleEndingStep(world, endingDeadline);
}

function cancelEndingSequence() {
    if (endingTimer) window.clearTimeout(endingTimer);
    endingTimer = null;
    endingStep = -1;
    endingPaused = false;
    let screen = document.getElementById('endingRewardScreen');
    if (screen) screen.classList.add('d-none');
    resetEndingRewardVideo();
}

function resetEndingRewardVideo() {
    let video = document.getElementById('endingRewardVideo');
    if (!video) return;
    video.onended = null;
    video.onerror = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
}

function handleEndingPauseKey(event) {
    if (event.code !== 'Space' || event.repeat) return false;
    if (isMenuControlTarget(document.activeElement)) return false;
    let backButton = document.getElementById('menuCreditsBackBtn');
    if (backButton && !backButton.classList.contains('d-none')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeMenuCredits();
        return true;
    }
    if (!toggleEndingPause()) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
}

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