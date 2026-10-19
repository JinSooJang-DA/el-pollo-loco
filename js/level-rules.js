
/** Loads the text rules before a level starts. */
let pendingLevelNumber = null;
let rulesRequestId = 0;

async function showLevelRules(levelNumber) {
    pendingLevelNumber = levelNumber;
    let requestId = ++rulesRequestId;

    let screen = document.getElementById('levelRulesScreen');
    let title = document.getElementById('levelRulesTitle');
    let content = document.getElementById('levelRulesText');
    let button = document.getElementById('levelRulesStartBtn');

    title.textContent = 'LEVEL ' + levelNumber;
    content.textContent = 'Loading level rules...';
    button.textContent = 'START LEVEL ' + levelNumber;
    button.disabled = true;
    screen.classList.remove('d-none');

    try {
        let response = await fetch('levels/rules/level' + levelNumber + '.txt');

        if (!response.ok) {
            throw new Error('Rules file not found');
        }

        let rulesText = await response.text();
        if (requestId !== rulesRequestId) return;

        content.textContent = rulesText;
    } catch (error) {
        if (requestId !== rulesRequestId) return;

        content.textContent =
            'Rules could not be loaded. You can still start Level ' +
            levelNumber + '.';

        console.error('Level rules:', error);
    }

    if (requestId === rulesRequestId) {
        button.disabled = false;
    }
}

/** Called by the START LEVEL button. */
function continueLevel() {
    if (pendingLevelNumber === null) return;

    let levelNumber = pendingLevelNumber;
    cancelLevelRules();
    beginLevel(levelNumber);
}

/** Closes the rules screen when starting or leaving a game. */
function cancelLevelRules() {
    pendingLevelNumber = null;
    rulesRequestId++;

    document.getElementById('levelRulesScreen').classList.add('d-none');
}
