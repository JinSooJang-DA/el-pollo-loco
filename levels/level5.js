
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
            new Coin(450, 210),
            new Coin(1150, 270),
            new Coin(1900, 190),
            new Coin(2600, 240)
        ]
    );

    level5.level_end_x = 719 * 4;
}
