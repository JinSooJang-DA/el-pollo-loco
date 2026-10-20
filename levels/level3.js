
/**
 * Global Level 3 dataset reference.
 * @type {Level}
 */
let level3;

/**
 * Initializes Level 3 with six enemies.
 */
function initLevel3() {
    initLevel();

    level3 = new Level(
        [
            new Chicken(500),
            new SmallChicken(900),
            new Chicken(1300),
            new SmallChicken(1700),
            new Chicken(2100),
            new SmallChicken(2500)
        ],
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        [
            new Coin(350, 190),
            new Coin(1100, 260),
            new Coin(1750, 210),
            new Coin(2650, 230)
        ]
    );

    level3.level_end_x = 719 * 4;
}
