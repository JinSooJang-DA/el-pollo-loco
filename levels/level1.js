/**
 * Global level 1 dataset reference.
 * @type {Level}
 */
let level1;

/**
 * Initializes Level 1 with enemies, clouds, backgrounds, bottles, and coins.
 */
function initLevel() {
    level1 = new Level(
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
            new Coin(500, 6),
            new Coin(700, 6),
            new Coin(900, 6),
            new Coin(1200, 6),
            new Coin(1400, 6)
        ]

    );

    level1.level_end_x = 719 * 4;
}