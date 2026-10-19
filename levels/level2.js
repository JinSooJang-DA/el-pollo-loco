
/**
 * Global Level 2 dataset reference.
 * @type {Level}
 */
let level2;

/**
 * Initializes Level 2 with four enemies.
 */
function initLevel2() {
    initLevel();

    level2 = new Level(
        [
            new Chicken(700),
            new SmallChicken(1100),
            new Chicken(1500),
            new SmallChicken(1900)
        ],
        level1.clouds,
        level1.backgroundObjects,
        level1.bottles,
        level1.coins
    );

    level2.level_end_x = 719 * 4;
}
