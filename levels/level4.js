
/**
 * Global Level 4 dataset reference.
 * @type {Level}
 */
let level4;

/**
 * Initializes Level 4 with eight enemies.
 */
function initLevel4() {
    initLevel();

    level4 = new Level(
        [
            new Chicken(500),
            new SmallChicken(800),
            new Chicken(1100),
            new SmallChicken(1400),
            new Chicken(1700),
            new SmallChicken(2000),
            new Chicken(2300),
            new SmallChicken(2600)
        ],
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        level1.coins
    );

    level4.level_end_x = 719 * 4;
}
