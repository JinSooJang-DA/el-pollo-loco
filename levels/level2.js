
/**
 * Global Level 2 dataset reference.
 * @type {Level}
 */
let level2;

/**
 * Initializes Level 2 with nine enemies.
 */
function initLevel2() {
    initLevel();
    const coinHeights = [50, 51, 51, 52, 52];

    for (let i = coinHeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [coinHeights[i], coinHeights[j]] =
            [coinHeights[j], coinHeights[i]];
    }

    level2 = new Level(
        [
            new Chicken(500),
            new SmallChicken(760),
            new Chicken(1020),
            new Chicken(1280),
            new SmallChicken(1540),
            new Chicken(1800),
            new Chicken(2060),
            new SmallChicken(2320),
            new Chicken(2580)
        ],
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        [
            new Coin(450, coinHeights[0]),
            new Coin(750, coinHeights[1]),
            new Coin(1200, coinHeights[2]),
            new Coin(1900, coinHeights[3]),
            new Coin(2600, coinHeights[4])
        ]
    );

    level2.level_end_x = 719 * 4;
}
