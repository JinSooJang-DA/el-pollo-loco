
/**
 * Global Level 5 dataset reference.
 * @type {Level}
 */
let level5;

/**
 * Initializes Level 5 with ten enemies.
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
            new Chicken(700),
            new SmallChicken(900),
            new Chicken(1100),
            new SmallChicken(1300),
            new Chicken(1500),
            new SmallChicken(1700),
            new Chicken(1900),
            new SmallChicken(2100),
            new Chicken(2300),
            new SmallChicken(2500)
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
