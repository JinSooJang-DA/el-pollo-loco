
/**
 * Global Level 4 dataset reference.
 * @type {Level}
 */
let level4;

/**
 * Initializes Level 4 with fifteen enemies.
 */
function initLevel4() {
    initLevel();
    const coinHeights = [50, 51, 51, 52, 52];

    for (let i = coinHeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [coinHeights[i], coinHeights[j]] =
            [coinHeights[j], coinHeights[i]];
    }

    level4 = new Level(
        [
            new Chicken(420),
            new SmallChicken(580),
            new Chicken(740),
            new Chicken(900),
            new SmallChicken(1060),
            new Chicken(1220),
            new Chicken(1380),
            new SmallChicken(1540),
            new Chicken(1700),
            new Chicken(1860),
            new SmallChicken(2020),
            new Chicken(2180),
            new Chicken(2340),
            new SmallChicken(2420),
            new Chicken(2640)
        ],
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        [
            new Coin(500, coinHeights[0]),
            new Coin(1250, coinHeights[1]),
            new Coin(1600, coinHeights[2]),
            new Coin(2000, coinHeights[3]),
            new Coin(2700, coinHeights[4])
        ]
    );

    level4.level_end_x = 719 * 4;
}
