
/** Sombrero rewards and level retries. */

let sombreros = 0;
let collectedCoinsByLevel = {};
let rewardNextLevel = null;

/** Starts a completely new game. */
function resetSombreroGame() {
    sombreros = 0;
    collectedCoinsByLevel = {};
    rewardNextLevel = null;
    updateSombreroCounter();
}

/** Shows one sombrero icon for each collected reward. */
function updateSombreroCounter() {
    let counter = document.getElementById('sombreroCounter');
    if (!counter) return;

    counter.innerHTML = '';

    for (let i = 0; i < sombreros; i++) {
        let hat = document.createElement('img');
        hat.src = 'img/golden-sombrero-big.webp';
        hat.className = 'sombrero-icon';
        hat.alt = 'Sombrero';
        hat.title = 'Extra life';
        counter.appendChild(hat);
    }
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
        playStoryVideo(6, () => {
            if (finishedWorld === world) {
                finishedWorld.showEndScreen('img/You won, you lost/You win B.png');
                playBgm(AUDIO_HUB.bgmWin);
            }
        });
        return;
    }

    playStoryVideo(nextLevel, () => {
        showCompletedLevelResult(finishedWorld, nextLevel);
    });
}

/** Shows a completed-level reward or the next level rules. */
function showCompletedLevelResult(finishedWorld, nextLevel) {
    if (finishedWorld !== world) return;

    if (finishedWorld.levelNumber !== 1 &&
        finishedWorld.character.energy === 100) {
        sombreros++;
        updateSombreroCounter();

        rewardNextLevel = nextLevel;

        document.getElementById('sombreroRewardScreen')
            .classList.remove('d-none');
        playBgm(AUDIO_HUB.bgmGame);
        return;
    }

    startLevel(nextLevel);
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

/** Spends one sombrero to retry the current level. */
function retryCurrentLevel() {
    if (!world || !world.gameEnded || sombreros < 1) return;
    if (!world.character.isDead()) return;

    let levelNumber = world.levelNumber;

    sombreros--;
    updateSombreroCounter();

    document.getElementById('restartScreen')
        .classList.add('d-none');

    startLevel(levelNumber);
}

/** Continue the sombrero reward screen with Space. */
document.addEventListener('keydown', function (event) {
    if (event.code !== 'Space' || event.repeat) return;

    let rewardScreen = document.getElementById('sombreroRewardScreen');

    if (rewardScreen && !rewardScreen.classList.contains('d-none')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        continueAfterSombrero();
    }
}, true);
