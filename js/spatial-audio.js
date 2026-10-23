
/**
 * Plays sound effects based on their screen position.
 * -0.8 = left, 0 = center, +0.8 = right
 */

let spatialAudioContext;

const BOTTLE_SMASH_PATH = 'audio/bottle-smash.mp3';

function getSpatialAudioContext() {
    if (!spatialAudioContext) {
        spatialAudioContext = new (
            window.AudioContext || window.webkitAudioContext
        )();
    }

    return spatialAudioContext;
}

function getSoundPan(worldX) {
    if (typeof world === 'undefined' || !world) return 0;

    let screenX = worldX + world.camera_x;
    let screenWidth = world.canvas.width;

    let pan = (screenX / screenWidth) * 2 - 1;

    return Math.max(-0.8, Math.min(0.8, pan));
}

function playSpatialSound(sound, worldX) {
    if (typeof isMuted !== 'undefined' && isMuted) return;
    if (typeof isStoryVideoPlaying === 'function' && isStoryVideoPlaying()) return;

    let audioPath = typeof sound === 'string'
        ? sound
        : sound.src;

    if (!audioPath) return;

    let audio = new Audio(audioPath);
    audio.volume = typeof sound === 'string'
        ? 0.5
        : sound.volume;

    let audioContext = getSpatialAudioContext();
    let source = audioContext.createMediaElementSource(audio);
    let panner = audioContext.createStereoPanner();

    panner.pan.value = getSoundPan(worldX);

    source.connect(panner);
    panner.connect(audioContext.destination);

    audio.addEventListener('ended', () => {
        source.disconnect();
        panner.disconnect();
    }, { once: true });

    audioContext.resume().then(() => {
        audio.play().catch(error => {
            console.warn('Spatial sound could not play:', error);
        });
    });
}

function playBottleSmashAt(worldX) {
    playSpatialSound(BOTTLE_SMASH_PATH, worldX);
}
