/**
 * Plays sound effects based on their screen position.
 * -0.8 = left, 0 = center, +0.8 = right
 */

let spatialAudioContext;

const BOTTLE_SMASH_PATH = 'audio/bottle-smash.mp3';

/** Retrieves or creates the spatial audio context. */
function getSpatialAudioContext() {
    if (!spatialAudioContext) {
        spatialAudioContext = new (
            window.AudioContext || window.webkitAudioContext
        )();
    }

    return spatialAudioContext;
}

/** Calculates the pan value based on the object's world position. */
function getSoundPan(worldX) {
    if (typeof world === 'undefined' || !world) return 0;

    let screenX = worldX + world.camera_x;
    let screenWidth = world.canvas.width;

    let pan = (screenX / screenWidth) * 2 - 1;

    return Math.max(-0.8, Math.min(0.8, pan));
}

/** Checks if conditions allow for playing spatial sounds. */
function canPlaySpatialSound() {
    if (typeof isMuted !== 'undefined' && isMuted) return false;
    if (typeof isStoryVideoPlaying === 'function' && isStoryVideoPlaying()) return false;
    
    return true;
}

/** Creates and configures the audio element for spatial playback. */
function createSpatialAudioElement(sound) {
    let audioPath = typeof sound === 'string'
        ? sound
        : sound.src;

    if (!audioPath) return null;

    let audio = new Audio(audioPath);
    audio.volume = typeof sound === 'string'
        ? 0.5
        : sound.volume;

    return audio;
}

/** Routes the audio element through a stereo panner node. */
function routeSpatialAudio(audio, worldX) {
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

    return audioContext;
}

/** Orchestrates the playback of a spatial sound effect. */
function playSpatialSound(sound, worldX) {
    if (!canPlaySpatialSound()) return;

    let audio = createSpatialAudioElement(sound);
    if (!audio) return;

    let audioContext = routeSpatialAudio(audio, worldX);

    audioContext.resume().then(() => {
        audio.play().catch(error => {
            console.warn('Spatial sound could not play:', error);
        });
    });
}

/** Helper function to play the bottle smash sound with panning. */
function playBottleSmashAt(worldX) {
    playSpatialSound(BOTTLE_SMASH_PATH, worldX);
}