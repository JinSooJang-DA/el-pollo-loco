
/**
 * Global Level 3 dataset reference.
 * @type {Level}
 */
let level3;

/**
 * Initializes Level 3 with twelve enemies.
 */
function initLevel3() {
    initLevel();
    const coinHeights = [50, 51, 51, 52, 52];

    for (let i = coinHeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [coinHeights[i], coinHeights[j]] =
            [coinHeights[j], coinHeights[i]];
    }

    level3 = new Level(
        [
            new Chicken(440),
            new SmallChicken(650),
            new Chicken(870),
            new Chicken(1080),
            new SmallChicken(1300),
            new Chicken(1510),
            new Chicken(1740),
            new SmallChicken(1960),
            new Chicken(2180),
            new SmallChicken(2380),
            new Chicken(2520),
            new Chicken(2660)
        ],
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        [
            new Coin(350, coinHeights[0]),
            new Coin(1100, coinHeights[1]),
            new Coin(1750, coinHeights[2]),
            new Coin(2250, coinHeights[3]),
            new Coin(2650, coinHeights[4])
        ]
    );

    level3.level_end_x = 719 * 4;
}
