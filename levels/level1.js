/**
 * Global level 1 dataset reference.
 * @type {Level}
 */
let level1;

/**
 * Initializes Level 1 with enemies, clouds, backgrounds, bottles, and coins.
 */
function initLevel() {
    const coinHeights = [50, 51, 51, 52, 52];

    for (let i = coinHeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [coinHeights[i], coinHeights[j]] =
            [coinHeights[j], coinHeights[i]];
    }
    level1 = new Level(
        [
            new Chicken(700),
            new SmallChicken(1100)
        ],
        [
            new Cloud()
        ],
        [
            new BackgroundObject('img/5_background/layers/air.png', -719),
            new BackgroundObject('img/5_background/layers/3_third_layer/2.png', -719),
            new BackgroundObject('img/5_background/layers/2_second_layer/2.png', -719),
            new BackgroundObject('img/5_background/layers/1_first_layer/2.png', -719),

            new BackgroundObject('img/5_background/layers/air.png', 0),
            new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 0),
            new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 0),
            new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 0),

            new BackgroundObject('img/5_background/layers/air.png', 719),
            new BackgroundObject('img/5_background/layers/3_third_layer/2.png', 719),
            new BackgroundObject('img/5_background/layers/2_second_layer/2.png', 719),
            new BackgroundObject('img/5_background/layers/1_first_layer/2.png', 719),

            new BackgroundObject('img/5_background/layers/air.png', 719 * 2),
            new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 719 * 2),
            new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 719 * 2),
            new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 719 * 2),

            new BackgroundObject('img/5_background/layers/air.png', 719 * 3),
            new BackgroundObject('img/5_background/layers/3_third_layer/2.png', 719 * 3),
            new BackgroundObject('img/5_background/layers/2_second_layer/2.png', 719 * 3),
            new BackgroundObject('img/5_background/layers/1_first_layer/2.png', 719 * 3),

            new BackgroundObject('img/5_background/layers/air.png', 719 * 4),
            new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 719 * 4),
            new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 719 * 4),
            new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 719 * 4)
        ],
        [
            new Bottle(400),
            new Bottle(700),
            new Bottle(1000),
            new Bottle(1300),
            new Bottle(1500),
            new Bottle(1700),
            new Bottle(1850),
            new Bottle(2100),
            new Bottle(2300)
        ],

        [
            new Coin(350, coinHeights[0]),
            new Coin(850, coinHeights[1]),
            new Coin(1350, coinHeights[2]),
            new Coin(1850, coinHeights[3]),
            new Coin(2550, coinHeights[4])
        ]

    );

    level1.level_end_x = 719 * 4;
}
