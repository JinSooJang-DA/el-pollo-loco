/**
 * Global level 1 dataset reference.
 * @type {Level}
 */
let level1;

/**
 * Creates the shuffled coin heights shared by the level coin rows.
 * @returns {number[]} Shuffled coin heights in placement order.
 */
function createShuffledCoinHeights() {
    const coinHeights = [50, 51, 51, 52, 52];

    for (let i = coinHeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [coinHeights[i], coinHeights[j]] =
            [coinHeights[j], coinHeights[i]];
    }
    return coinHeights;
}

/**
 * Creates the Level 1 chicken lineup.
 * @returns {MovableObject[]} Enemies in spawn order.
 */
function createLevel1Enemies() {
    return [
        new Chicken(600),
        new SmallChicken(900),
        new Chicken(1200),
        new Chicken(1500),
        new SmallChicken(1800),
        new Chicken(2250)
    ];
}

/**
 * Creates one 719px background slice with all four layers.
 * @param {number} x - Horizontal tile position.
 * @param {number} variant - Background variant folder (1 or 2).
 * @returns {BackgroundObject[]} The four layers of one slice.
 */
function createBackgroundSlice(x, variant) {
    return [
        new BackgroundObject('img/5_background/layers/air.png', x),
        new BackgroundObject(`img/5_background/layers/3_third_layer/${variant}.png`, x),
        new BackgroundObject(`img/5_background/layers/2_second_layer/${variant}.png`, x),
        new BackgroundObject(`img/5_background/layers/1_first_layer/${variant}.png`, x)
    ];
}

/**
 * Creates the Level 1 background tiles.
 * @returns {BackgroundObject[]} Background layers in render order.
 */
function createLevel1Backgrounds() {
    return [
        ...createBackgroundSlice(-719, 2),
        ...createBackgroundSlice(0, 1),
        ...createBackgroundSlice(719, 2),
        ...createBackgroundSlice(719 * 2, 1),
        ...createBackgroundSlice(719 * 3, 2),
        ...createBackgroundSlice(719 * 4, 1)
    ];
}

/**
 * Creates the Level 1 bottle pickups.
 * @returns {Bottle[]} Bottles in spawn order.
 */
function createLevel1Bottles() {
    return [
        new Bottle(400),
        new Bottle(700),
        new Bottle(1000),
        new Bottle(1300),
        new Bottle(1500),
        new Bottle(1700),
        new Bottle(1850),
        new Bottle(2100),
        new Bottle(2300)
    ];
}

/**
 * Creates the Level 1 coin row.
 * @param {number[]} coinHeights - Shuffled coin heights.
 * @returns {Coin[]} Coins in spawn order.
 */
function createLevel1Coins(coinHeights) {
    return [
        new Coin(350, coinHeights[0]),
        new Coin(850, coinHeights[1]),
        new Coin(1350, coinHeights[2]),
        new Coin(1850, coinHeights[3]),
        new Coin(2550, coinHeights[4])
    ];
}

/**
 * Initializes Level 1 with six enemies, clouds, backgrounds, bottles, and coins.
 */
function initLevel() {
    const coinHeights = createShuffledCoinHeights();

    level1 = new Level(
        createLevel1Enemies(),
        [new Cloud()],
        createLevel1Backgrounds(),
        createLevel1Bottles(),
        createLevel1Coins(coinHeights)
    );

    level1.level_end_x = 719 * 4;
}
