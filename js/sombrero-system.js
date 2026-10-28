/**
 * Sombrero rewards, HUD counters and level revives.
 */

let sombreros = 0;
let collectedCoinsByLevel = {};
let rewardNextLevel = null;
let totalCollectedCoins = 0;

/**
 * Resets the sombrero and coin state for a new game.
 */
function resetSombreroGame() {
    sombreros = 0;
    collectedCoinsByLevel = {};
    rewardNextLevel = null;
    totalCollectedCoins = 0;
    cancelEndingSequence();
    updateSombreroCounter();
    updateCollectedCoinCounter();
}

/**
 * Updates the on-screen sombrero icons based on available lives.
 */
function updateSombreroCounter() {
    let counter = document.getElementById('sombreroCounter');
    let template = document.getElementById('sombreroIconTemplate');
    if (!counter || !template) return;
    counter.replaceChildren();
    for (let i = 0; i < sombreros; i++) {
        let icon = template.content.firstElementChild.cloneNode(true);
        counter.appendChild(icon);
    }
}

/**
 * Updates the globally collected coin amount in the HUD.
 */
function updateCollectedCoinCounter() {
    let value = document.getElementById('coinCollectedValue');
    if (value) value.textContent = '× ' + totalCollectedCoins;
}

/**
 * Increments and displays the globally collected coins.
 */
function recordCollectedCoin() {
    totalCollectedCoins++;
    updateCollectedCoinCounter();
}

/**
 * Records a collected coin to prevent it from respawning on retry.
 * @param {number} levelNumber The current level index.
 * @param {Coin} coin The collected coin instance.
 */
function rememberCollectedCoin(levelNumber, coin) {
    if (!collectedCoinsByLevel[levelNumber]) {
        collectedCoinsByLevel[levelNumber] = [];
    }
    let positions = collectedCoinsByLevel[levelNumber];
    if (!positions.includes(coin.x)) positions.push(coin.x);
}

/**
 * Removes previously collected coins from the target level array.
 * @param {number} levelNumber The current level index.
 */
function removeCollectedCoins(levelNumber) {
    let levels = [level1, level2, level3, level4, level5];
    let currentLevel = levels[levelNumber - 1];
    let collected = collectedCoinsByLevel[levelNumber] || [];
    currentLevel.coins = currentLevel.coins.filter(coin => {
        return !collected.includes(coin.x);
    });
}

/**
 * Proceeds to the next level or finale after clearing the current one.
 * @param {World} finishedWorld The cleared world instance.
 */
function finishCompletedLevel(finishedWorld) {
    let nextLevel = finishedWorld.levelNumber + 1;
    if (finishedWorld.levelNumber === 5) {
        return finishFinalLevel(finishedWorld);
    }
    playStoryVideo(nextLevel, () => {
        showCompletedLevelResult(finishedWorld, nextLevel);
    });
}

/**
 * Handles the final level victory condition and triggers the ending flow.
 * @param {World} finishedWorld The final cleared world instance.
 */
function finishFinalLevel(finishedWorld) {
    if (finishedWorld.character.energy === 100) {
        sombreros++;
        updateSombreroCounter();
    }
    playStoryVideo(6, () => {
        if (finishedWorld === world) startFinalEnding(finishedWorld);
    });
}

/**
 * Resolves the level outcome, presenting a reward screen or starting the next level.
 * @param {World} finishedWorld The cleared world instance.
 * @param {number} nextLevel The next level index.
 */
function showCompletedLevelResult(finishedWorld, nextLevel) {
    if (finishedWorld !== world) return;
    if (finishedWorld.levelNumber !== 1 &&
        finishedWorld.character.energy === 100) {
        return showSombreroReward(nextLevel);
    }
    startLevel(nextLevel);
}

/**
 * Presents the sombrero reward screen before continuing.
 * @param {number} nextLevel The next level index to start.
 */
function showSombreroReward(nextLevel) {
    sombreros++;
    updateSombreroCounter();
    rewardNextLevel = nextLevel;
    document.getElementById('sombreroRewardScreen').classList.remove('d-none');
    playBgm(audioHub.bgmGame);
}

/**
 * Continues the pending level after accepting the sombrero reward.
 */
function continueAfterSombrero() {
    document.getElementById('sombreroRewardScreen').classList.add('d-none');
    let nextLevel = rewardNextLevel;
    rewardNextLevel = null;
    if (nextLevel !== null) startLevel(nextLevel);
}

/**
 * Cancels the pending sombrero reward process.
 */
function cancelSombreroReward() {
    document.getElementById('sombreroRewardScreen').classList.add('d-none');
    rewardNextLevel = null;
}

/**
 * Consumes a sombrero to revive Pepe and reset the current level run.
 */
function retryCurrentLevel() {
    if (!world || !world.gameEnded || sombreros < 1) return;
    if (!world.character.isDead()) return;
    sombreros--;
    updateSombreroCounter();
    document.getElementById('restartScreen').classList.add('d-none');
    reviveCharacter(world.character);
    reviveWorld(world);
    let boss = world.level.enemies.find(enemy => enemy instanceof Endboss);
    playBgm(boss?.hadFirstContact ? audioHub.bgmBoss : audioHub.bgmGame);
    showReviveMessage();
}

/**
 * Restores Pepe's health and grants temporary invincibility.
 * @param {Character} character The character to revive.
 */
function reviveCharacter(character) {
    character.energy = 100;
    character.lastHit = 0;
    character.deadFrameIndex = 0;
    character.speedY = 0;
    character.resetIdleTimer();
    character.reviveProtectionUntil = Date.now() + 5000;
}

/**
 * Re-enables world logic and rendering routines.
 * @param {World} activeWorld The world instance to reactivate.
 */
function reviveWorld(activeWorld) {
    activeWorld.canThrow = true;
    activeWorld.statusBar.setPercentage(100);
    activeWorld.gameEnded = false;
    activeWorld.stopDrawing = false;
}

/**
 * Checks if the character currently holds revive invulnerability.
 * @param {Character} character The character instance.
 * @returns {boolean} True if revive protection is active.
 */
function hasReviveProtection(character) {
    return Boolean(character && Date.now() < (character.reviveProtectionUntil || 0));
}

/**
 * Briefly displays a centered message indicating a successful revive.
 */
function showReviveMessage() {
    let message = document.getElementById('reviveMessage');
    if (!message) return;
    message.classList.add('is-visible');
    window.setTimeout(() => message.classList.remove('is-visible'), 1800);
}
