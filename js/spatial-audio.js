/**
 * Plays sound effects based on their screen position.
 * -0.8 = left, 0 = center, +0.8 = right
 */

let spatialAudioContext;

const bottleSmashPath = 'audio/bottle-smash.mp3';

/**
 * Retrieves or creates the spatial audio context.
 * @returns {AudioContext} The shared audio context.
 */
function getSpatialAudioContext() {
    if (!spatialAudioContext) {
        spatialAudioContext = new (
            window.AudioContext || window.webkitAudioContext
        )();
    }

    return spatialAudioContext;
}

/**
 * Calculates the pan value based on the object's world position.
 * @param {number} worldX The x position of the sound source.
 * @returns {number} Stereo pan value between -0.8 and 0.8.
 */
function getSoundPan(worldX) {
    if (typeof world === 'undefined' || !world) return 0;

    let screenX = worldX + world.camera_x;
    let screenWidth = world.canvas.width;

    let pan = (screenX / screenWidth) * 2 - 1;

    return Math.max(-0.8, Math.min(0.8, pan));
}

/**
 * Checks if conditions allow for playing spatial sounds.
 * @returns {boolean} True if spatial sounds may play.
 */
function canPlaySpatialSound() {
    if (typeof isMuted !== 'undefined' && isMuted) return false;
    if (typeof isStoryVideoPlaying === 'function' && isStoryVideoPlaying()) return false;
    
    return true;
}

/**
 * Creates and configures the audio element for spatial playback.
 * @param {HTMLAudioElement|string} sound The sound element or audio file path.
 * @returns {HTMLAudioElement|null} The new audio element, or null without a source.
 */
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

/**
 * Routes the audio element through a stereo panner node.
 * @param {HTMLAudioElement} audio The audio element to route.
 * @param {number} worldX The x position of the sound source.
 * @returns {AudioContext} The audio context used for routing.
 */
function routeSpatialAudio(audio, worldX) {
    let audioContext = getSpatialAudioContext();
    let source = audioContext.createMediaElementSource(audio);
    let panner = audioContext.createStereoPanner();

    panner.pan.value = getSoundPan(worldX);
    connectSpatialNodes(audioContext, source, panner);
    disconnectSpatialAudioOnEnd(audio, source, panner);

    return audioContext;
}

/**
 * Connects the source through the panner to the audio destination.
 * @param {AudioContext} audioContext The active audio context.
 * @param {AudioNode} source The media element source node.
 * @param {StereoPannerNode} panner The stereo panner node.
 */
function connectSpatialNodes(audioContext, source, panner) {
    source.connect(panner);
    panner.connect(audioContext.destination);
}

/**
 * Disconnects the source and panner once playback ends.
 * @param {HTMLAudioElement} audio The spatial audio element.
 * @param {AudioNode} source The media element source node.
 * @param {StereoPannerNode} panner The stereo panner node.
 */
function disconnectSpatialAudioOnEnd(audio, source, panner) {
    audio.addEventListener('ended', () => {
        source.disconnect();
        panner.disconnect();
    }, { once: true });
}

/**
 * Orchestrates the playback of a spatial sound effect.
 * @param {HTMLAudioElement|string} sound The sound element or audio file path.
 * @param {number} worldX The x position of the sound source.
 */
function playSpatialSound(sound, worldX) {
    if (!canPlaySpatialSound()) return;

    let audio = createSpatialAudioElement(sound);
    if (!audio) return;

    let audioContext = routeSpatialAudio(audio, worldX);

    audioContext.resume().then(() => {
        audio.play().catch(() => { /* Browser playback rules may block the sound. */ });
    });
}

/**
 * Helper function to play the bottle smash sound with panning.
 * @param {number} worldX The x position of the broken bottle.
 */
function playBottleSmashAt(worldX) {
    playSpatialSound(bottleSmashPath, worldX);
}