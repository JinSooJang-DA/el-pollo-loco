# El Pollo Loco

A 2D jump-and-run browser game built with vanilla JavaScript and HTML5 Canvas.
Help Pepe fight his way through five levels of angry chickens and defeat the giant boss hen.

**[▶ Play it live](https://jinsoojang-da.github.io/el-pollo-loco/)**

Created during the Frontend course at [Developer Akademie](https://developerakademie.com/),
based on the original El Pollo Loco tutorial and extended with my own game design and features.

## Features

- **5 levels** with individual rules, enemy lineups and a level intro card
- **Two enemy types + Endboss** – chickens can be stomped, baby chicks only by bottle
- **Coins & health** – coins heal Pepe or are stored as damage protection
- **High coin** – one coin per level is only reachable by boosting off the boss and restores full health
- **Sombrero system** – finish levels 2–5 with full health to earn an extra life
- **Ending rewards** – special reward videos for 3+ sombreros or 20+ coins
- **Story videos** between levels and animated end credits
- **Sound** – background music with a selectable soundtrack, stereo-panned sound effects, mute state saved in Local Storage
- **Pause menu, restart and retry** without reloading the page
- **Fullscreen mode** – leaving fullscreen with Escape pauses the game and opens the Menu
- **Full keyboard navigation** for all menus and dialogs
- **Mobile support** – touch controls in landscape mode, rotate-device hint in portrait mode

## Controls

| Key | Action |
|---|---|
| ← → | Move |
| Space | Jump / stomp |
| D | Throw bottle |
| Esc | Open / close Menu |
| Arrow keys, Tab | Navigate menus |
| Enter / Space | Select in menus |

On phones and tablets, on-screen touch buttons are shown in landscape mode.

## Tech Stack

- HTML5 Canvas, CSS3, vanilla JavaScript (ES6 classes)
- Web Audio API for stereo panning
- Local Storage for sound settings
- Documented with [JSDoc](https://jsdoc.app/)
- Deployed with GitHub Actions to GitHub Pages

## Project Structure

```
classes/   Game object classes (character, enemies, world, status bars, …)
js/        Game flow, input, audio, menus and reward systems
levels/    Level data and level rule texts
styles/    Stylesheets
img/ audio/ videos/ fonts/   Assets
tests/     Node regression checks
```

## Run Locally

Clone the repository and open `index.html` with a local server (e.g. the VS Code Live Server extension).

```bash
git clone https://github.com/JinSooJang-DA/el-pollo-loco.git
```

Run the regression checks with Node.js:

```bash
node tests/ending-flow-check.js
```

## Credits

- Original game tutorial and artwork: Developer Akademie (Junus Ergin)
- Game design, extended development and additional graphics: Jin Soo Jang

### AI Assistance

This project was developed with the help of several AI tools:

- **Gemini** – early programming, debugging and music creation
- **ChatGPT** – multimedia, art programming and debugging
- **Google Flow** – AI cinematics (story and ending videos)
- **Claude** – final code review, clean-code optimization and JSDoc documentation
- **Meta Muse** and **DeepSeek** – additional support
