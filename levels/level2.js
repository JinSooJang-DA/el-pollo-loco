
/**
 * Global Level 2 dataset reference.
 * @type {Level}
 */
let level2;

/**
 * Creates the Level 2 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel2Enemies() {
    return [
        new Chicken(500),
        new SmallChicken(760),
        new Chicken(1020),
        new Chicken(1280),
        new SmallChicken(1540),
        new Chicken(1800),
        new Chicken(2060),
        new SmallChicken(2320),
        new Chicken(2580)
    ];
}

/**
 * Creates the Level 2 coin row.
 * @param {number[]} coinHeights - Shuffled coin heights.
 * @returns {Coin[]} Coins in spawn order.
 */
function createLevel2Coins(coinHeights) {
    return [
        new Coin(450, coinHeights[0]),
        new Coin(750, coinHeights[1]),
        new Coin(1200, coinHeights[2]),
        new Coin(1900, coinHeights[3]),
        new Coin(2600, coinHeights[4])
    ];
}

/**
 * Initializes Level 2 with nine enemies.
 */
function initLevel2() {
    initLevel();
    const coinHeights = createShuffledCoinHeights();

    level2 = new Level(
        createLevel2Enemies(),
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        createLevel2Coins(coinHeights)
    );

    level2.level_end_x = 719 * 4;
}
