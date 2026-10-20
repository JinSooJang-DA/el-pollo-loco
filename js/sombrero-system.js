
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

/** Gives a reward for finishing with all three coins. */
function finishCompletedLevel(finishedWorld) {
    let nextLevel = finishedWorld.levelNumber + 1;

    if (finishedWorld.character.energy === 100) {
        sombreros++;
        updateSombreroCounter();

        rewardNextLevel = nextLevel;
        finishedWorld.stopDrawing = true;
        stopAllIntervals();

        document.getElementById('sombreroRewardScreen')
            .classList.remove('d-none');
        return;
    }

    if (nextLevel <= 5) {
        startLevel(nextLevel);
    } else {
        finishedWorld.showEndScreen('img/You won, you lost/You win B.png');
    }
}

/** Continues after the reward screen. */
function continueAfterSombrero() {
    document.getElementById('sombreroRewardScreen')
        .classList.add('d-none');

    let nextLevel = rewardNextLevel;
    rewardNextLevel = null;

    if (nextLevel <= 5) {
        startLevel(nextLevel);
    } else if (world) {
        world.showEndScreen('img/You won, you lost/You win B.png');
    }
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
document.addEventListener('keydown', function(event) {
    if (event.code !== 'Space' || event.repeat) return;

    let rewardScreen = document.getElementById('sombreroRewardScreen');

    if (rewardScreen && !rewardScreen.classList.contains('d-none')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        continueAfterSombrero();
    }
}, true);
