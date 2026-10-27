
/**
 * Global Level 5 dataset reference.
 * @type {Level}
 */
let level5;

/**
 * Creates the Level 5 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel5Enemies() {
    return [
        ...createLevel5EnemiesFirstHalf(),
        ...createLevel5EnemiesSecondHalf()
    ];
}

/**
 * Creates the first half of the Level 5 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel5EnemiesFirstHalf() {
    return [
        new Chicken(350),
        new SmallChicken(460),
        new Chicken(570),
        new Chicken(680),
        new SmallChicken(790),
        new Chicken(900),
        new Chicken(1010),
        new SmallChicken(1120),
        new Chicken(1230)
    ];
}

/**
 * Creates the second half of the Level 5 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel5EnemiesSecondHalf() {
    return [
        new Chicken(1340),
        new SmallChicken(1450),
        new Chicken(1560),
        new Chicken(1670),
        new SmallChicken(1780),
        new Chicken(1890),
        new Chicken(2000),
        new SmallChicken(2110),
        new Chicken(2220)
    ];
}

/**
 * Creates the Level 5 coin row.
 * @param {number[]} coinHeights - Shuffled coin heights.
 * @returns {Coin[]} Coins in spawn order.
 */
function createLevel5Coins(coinHeights) {
    return [
        new Coin(450, coinHeights[0]),
        new Coin(1150, coinHeights[1]),
        new Coin(1900, coinHeights[2]),
        new Coin(2250, coinHeights[3]),
        new Coin(2600, coinHeights[4])
    ];
}

/**
 * Initializes Level 5 with eighteen enemies before the boss encounter.
 */
function initLevel5() {
    initLevel();
    const coinHeights = createShuffledCoinHeights();

    level5 = new Level(
        createLevel5Enemies(),
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        createLevel5Coins(coinHeights)
    );

    level5.level_end_x = 719 * 4;
}
