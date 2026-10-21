
/**
 * Global Level 5 dataset reference.
 * @type {Level}
 */
let level5;

/**
 * Initializes Level 5 with eighteen enemies before the boss encounter.
 */
function initLevel5() {
    initLevel();
    const coinHeights = [50, 51, 51, 52, 52];

    for (let i = coinHeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [coinHeights[i], coinHeights[j]] =
            [coinHeights[j], coinHeights[i]];
    }

    level5 = new Level(
        [
            new Chicken(350),
            new SmallChicken(460),
            new Chicken(570),
            new Chicken(680),
            new SmallChicken(790),
            new Chicken(900),
            new Chicken(1010),
            new SmallChicken(1120),
            new Chicken(1230),
            new Chicken(1340),
            new SmallChicken(1450),
            new Chicken(1560),
            new Chicken(1670),
            new SmallChicken(1780),
            new Chicken(1890),
            new Chicken(2000),
            new SmallChicken(2110),
            new Chicken(2220)
        ],
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        [
            new Coin(450, coinHeights[0]),
            new Coin(1150, coinHeights[1]),
            new Coin(1900, coinHeights[2]),
            new Coin(2250, coinHeights[3]),
            new Coin(2600, coinHeights[4])
        ]
    );

    level5.level_end_x = 719 * 4;
}
