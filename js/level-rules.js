/**
 * Loads the text rules before a level starts.
 */
let pendingLevelNumber = null;
let rulesRequestId = 0;

/**
 * Sets up the level rules UI elements.
 * @param {number} levelNumber The level index to initialize.
 */
function setupLevelRulesUi(levelNumber) {
    let title = document.getElementById('levelRulesTitle');
    let image = document.getElementById('levelRulesImage');
    let content = document.getElementById('levelRulesText');
    let button = document.getElementById('levelRulesStartBtn');

    title.textContent = 'LEVEL ' + levelNumber;
    image.src = 'img/tip-lv' + levelNumber + '.webp';
    image.alt = 'Level ' + levelNumber + ' tip';
    content.textContent = 'Loading level rules...';
    button.textContent = 'START LEVEL ' + levelNumber;
    button.disabled = true;
    document.getElementById('levelRulesScreen').classList.remove('d-none');
}

/**
 * Fetches the rules text for the specified level.
 * @param {number} levelNumber The level index to fetch.
 * @param {number} requestId The current request tracking ID.
 */
async function fetchLevelRules(levelNumber, requestId) {
    let content = document.getElementById('levelRulesText');
    try {
        let response = await fetch('levels/rules/level' + levelNumber + '.txt');
        if (!response.ok) throw new Error('Rules file not found');
        let rulesText = await response.text();
        if (requestId === rulesRequestId) content.textContent = rulesText;
    } catch {
        if (requestId !== rulesRequestId) return;
        content.textContent = 'Rules could not be loaded. You can still start Level ' + levelNumber + '.';
    }
}

/**
 * Prepares and shows the level rules screen.
 * @param {number} levelNumber The level index to display.
 */
async function showLevelRules(levelNumber) {
    pendingLevelNumber = levelNumber;
    let requestId = ++rulesRequestId;
    setupLevelRulesUi(levelNumber);
    await fetchLevelRules(levelNumber, requestId);
    if (requestId === rulesRequestId) {
        document.getElementById('levelRulesStartBtn').disabled = false;
    }
}

/**
 * Called by the START LEVEL button.
 */
function continueLevel() {
    if (pendingLevelNumber === null) return;
    let levelNumber = pendingLevelNumber;
    cancelLevelRules();
    beginLevel(levelNumber);
}

/**
 * Closes the rules screen when starting or leaving a game.
 */
function cancelLevelRules() {
    pendingLevelNumber = null;
    rulesRequestId++;
    document.getElementById('levelRulesScreen').classList.add('d-none');
}

/**
 * Starts the pending level with SPACE while the rules screen is visible.
 * @param {KeyboardEvent} event The pressed keyboard event.
 */
function handleLevelRulesKey(event) {
    if (event.code !== 'Space') return;
    const rulesScreen = document.getElementById('levelRulesScreen');
    const startButton = document.getElementById('levelRulesStartBtn');
    if (!rulesScreen || rulesScreen.classList.contains('d-none')) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.repeat || !startButton || startButton.disabled) return;
    continueLevel();
}
document.addEventListener('keydown', handleLevelRulesKey, true);