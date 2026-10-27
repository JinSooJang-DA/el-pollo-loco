
/**
 * Global Level 3 dataset reference.
 * @type {Level}
 */
let level3;

/**
 * Creates the Level 3 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel3Enemies() {
    return [
        ...createLevel3EnemiesFirstHalf(),
        ...createLevel3EnemiesSecondHalf()
    ];
}

/**
 * Creates the first half of the Level 3 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel3EnemiesFirstHalf() {
    return [
        new Chicken(440),
        new SmallChicken(650),
        new Chicken(870),
        new Chicken(1080),
        new SmallChicken(1300),
        new Chicken(1510)
    ];
}

/**
 * Creates the second half of the Level 3 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel3EnemiesSecondHalf() {
    return [
        new Chicken(1740),
        new SmallChicken(1960),
        new Chicken(2180),
        new SmallChicken(2380),
        new Chicken(2520),
        new Chicken(2660)
    ];
}

/**
 * Creates the Level 3 coin row.
 * @param {number[]} coinHeights - Shuffled coin heights.
 * @returns {Coin[]} Coins in spawn order.
 */
function createLevel3Coins(coinHeights) {
    return [
        new Coin(350, coinHeights[0]),
        new Coin(1100, coinHeights[1]),
        new Coin(1750, coinHeights[2]),
        new Coin(2250, coinHeights[3]),
        new Coin(2650, coinHeights[4])
    ];
}

/**
 * Initializes Level 3 with twelve enemies.
 */
function initLevel3() {
    initLevel();
    const coinHeights = createShuffledCoinHeights();

    level3 = new Level(
        createLevel3Enemies(),
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        createLevel3Coins(coinHeights)
    );

    level3.level_end_x = 719 * 4;
}
