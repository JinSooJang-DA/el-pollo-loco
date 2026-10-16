let level1;

function initLevel() {
    level1 = new Level(
        // 1. 적 목록 (Enemies)
        [
            new Chicken(700),
            new Chicken(1100),
            new Chicken(1500),
            new Chicken(1900),
            new Endboss()
        ],
        // 2. 구름 (Clouds)
        [
            new Cloud()
        ],
        // 3. 배경 레이어 (Backgrounds)
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
            new BackgroundObject('img/5_background/layers/1_first_layer/2.png', 719 * 3)
        ],
        // 4. 바닥 병 목록 (Bottles)
        [
            new Bottle(400),
            new Bottle(700),
            new Bottle(1000),
            new Bottle(1300),
            new Bottle(1500),
            new Bottle(1700),
            new Bottle(1850)
        ],
        // 5. 공중 코인 목록 (Coins)
        [
            new Coin(500, 300),
            new Coin(600, 200),
            new Coin(700, 150),
            new Coin(800, 200),
            new Coin(900, 300),
            new Coin(1200, 180),
            new Coin(1400, 150)
        ]
    );
}