/**
 * UI element showing boss health percentage.
 * @extends DrawableObject
 */
class StatusBarEndboss extends DrawableObject {
    IMAGES = [
        'img/7_statusbars/2_statusbar_endboss/orange/orange0.png',
        'img/7_statusbars/2_statusbar_endboss/orange/orange20.png',
        'img/7_statusbars/2_statusbar_endboss/orange/orange40.png',
        'img/7_statusbars/2_statusbar_endboss/orange/orange60.png',
        'img/7_statusbars/2_statusbar_endboss/orange/orange80.png',
        'img/7_statusbars/2_statusbar_endboss/orange/orange100.png'
    ];

    percentage = 100;

    /**
     * Creates Endboss health bar positioned at top-right.
     */
    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.x = 500;
        this.y = 10;
        this.width = 200;
        this.height = 60;
        this.setPercentage(100);
    }

    /**
     * Sets boss health percentage and updates visual state.
     * @param {number} percentage - Health percentage level (0 to 100).
     */
    setPercentage(percentage) {
        this.percentage = percentage;
        let path = this.IMAGES[this.resolveImageIndex()];
        this.img = this.imageCache[path];
    }

    /**
     * Maps boss energy percentage to corresponding image index.
     * @returns {number} Index between 0 and 5.
     */
    resolveImageIndex() {
        if (this.percentage == 100) return 5;
        if (this.percentage >= 75) return 4;
        if (this.percentage >= 50) return 3;
        if (this.percentage >= 25) return 2;
        if (this.percentage > 0) return 1;
        return 0;
    }
}