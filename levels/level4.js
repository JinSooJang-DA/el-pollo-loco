
/**
 * Global Level 4 dataset reference.
 * @type {Level}
 */
let level4;

/**
 * Creates the Level 4 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel4Enemies() {
    return [
        ...createLevel4EnemiesFirstHalf(),
        ...createLevel4EnemiesSecondHalf()
    ];
}

/**
 * Creates the first half of the Level 4 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel4EnemiesFirstHalf() {
    return [
        new Chicken(420),
        new SmallChicken(580),
        new Chicken(740),
        new Chicken(900),
        new SmallChicken(1060),
        new Chicken(1220),
        new Chicken(1380),
        new SmallChicken(1540)
    ];
}

/**
 * Creates the second half of the Level 4 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel4EnemiesSecondHalf() {
    return [
        new Chicken(1700),
        new Chicken(1860),
        new SmallChicken(2020),
        new Chicken(2180),
        new Chicken(2340),
        new SmallChicken(2420),
        new Chicken(2640)
    ];
}

/**
 * Creates the Level 4 coin row.
 * @param {number[]} coinHeights - Shuffled coin heights.
 * @returns {Coin[]} Coins in spawn order.
 */
function createLevel4Coins(coinHeights) {
    return [
        new Coin(500, coinHeights[0]),
        new Coin(1250, coinHeights[1]),
        new Coin(1600, coinHeights[2]),
        new Coin(2000, coinHeights[3]),
        new Coin(2700, coinHeights[4])
    ];
}

/**
 * Initializes Level 4 with fifteen enemies.
 */
function initLevel4() {
    initLevel();
    const coinHeights = createShuffledCoinHeights();

    level4 = new Level(
        createLevel4Enemies(),
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        createLevel4Coins(coinHeights)
    );

    level4.level_end_x = 719 * 4;
}
