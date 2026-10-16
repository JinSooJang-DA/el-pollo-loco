/**
 * Data container storing entity collections and boundaries for a game level.
 */
class Level {
    enemies;
    clouds;
    backgroundObjects;
    bottles;
    coins;
    level_end_x = 2200;

    /**
     * Instantiates a game stage level.
     * @param {MovableObject[]} enemies - List of level enemies.
     * @param {Cloud[]} clouds - List of moving background clouds.
     * @param {BackgroundObject[]} backgroundObjects - List of parallax layers.
     * @param {Bottle[]} bottles - List of collectible bottles.
     * @param {Coin[]} coins - List of collectible coins.
     */
    constructor(enemies, clouds, backgroundObjects, bottles, coins) {
        this.enemies = enemies;
        this.clouds = clouds;
        this.backgroundObjects = backgroundObjects;
        this.bottles = bottles;
        this.coins = coins;
    }
}