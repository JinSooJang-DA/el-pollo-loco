/**
 * Width of the game container in pixels, as set in base.css.
 * @type {number}
 */
const gameBaseWidth = 720;

/**
 * Space in pixels kept free on both sides of the scaled game.
 * @type {number}
 */
const gameSideGap = 16;

/**
 * Matches devices with a mouse, whose browser window can be narrower than the game.
 * @type {MediaQueryList}
 */
const desktopPointerQuery = window.matchMedia('(hover: hover)');

/**
 * Scales the whole game down when a desktop window is narrower than the game,
 * so no part of it is cut off. Phones and tablets keep their own responsive layout.
 */
function fitGameToDesktopWindow() {
    const container = document.getElementById('gameContainer');
    if (!container) return;
    const availableWidth = document.documentElement.clientWidth - gameSideGap * 2;
    const scale = Math.min(1, availableWidth / gameBaseWidth);
    const useScale = desktopPointerQuery.matches && scale < 1;
    container.style.zoom = useScale ? String(scale) : '';
}

window.addEventListener('resize', fitGameToDesktopWindow);
window.addEventListener('DOMContentLoaded', fitGameToDesktopWindow);
desktopPointerQuery.addEventListener('change', fitGameToDesktopWindow);
