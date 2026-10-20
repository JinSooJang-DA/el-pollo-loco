/** Controls the skippable story videos that separate game chapters. */
let storyVideoActive = false;
let storyVideoFinishing = false;
let storyVideoComplete = null;

/** Returns whether gameplay input must be blocked for a story video. */
function isStoryVideoPlaying() {
    return storyVideoActive;
}

/** Applies the game's mute and effect-volume preferences to the story video. */
function syncStoryVideoMute() {
    let video = document.getElementById('storyVideo');
    if (!video) return;

    video.muted = isMuted;
    video.volume = sfxVolume;
}

/** Clears held keys so no movement starts when a video closes. */
function clearGameplayInput() {
    ['LEFT', 'RIGHT', 'UP', 'DOWN', 'SPACE', 'D'].forEach(key => {
        keyboard[key] = false;
    });
}

/** Plays one story chapter and completes its callback exactly once. */
function playStoryVideo(videoNumber, onComplete) {
    if (storyVideoActive || storyVideoFinishing) return;

    let screen = document.getElementById('storyVideoScreen');
    let video = document.getElementById('storyVideo');
    if (!screen || !video) {
        onComplete();
        return;
    }

    storyVideoActive = true;
    storyVideoFinishing = false;
    storyVideoComplete = onComplete;
    clearGameplayInput();
    if (currentBgm) currentBgm.pause();
    stopSoundEffects();

    screen.classList.remove('d-none');
    video.src = `videos/loco-0${videoNumber}.mp4`;
    video.currentTime = 0;
    syncStoryVideoMute();
    video.onended = () => finishStoryVideo();
    video.onerror = () => finishStoryVideo();
    video.play().catch(() => { });
}

/** Skips the active story chapter from the on-screen button or Space. */
function skipStoryVideo() {
    finishStoryVideo();
}

/** Hides the chapter and runs the next transition once. */
function finishStoryVideo() {
    if (!storyVideoActive || storyVideoFinishing) return;

    storyVideoFinishing = true;
    storyVideoActive = false;

    let screen = document.getElementById('storyVideoScreen');
    let video = document.getElementById('storyVideo');
    if (video) {
        video.pause();
        video.onended = null;
        video.onerror = null;
    }
    if (screen) screen.classList.add('d-none');

    clearGameplayInput();
    let onComplete = storyVideoComplete;
    storyVideoComplete = null;
    storyVideoFinishing = false;
    if (typeof onComplete === 'function') onComplete();
}

/** Captures Space before gameplay input can receive it. */
document.addEventListener('keydown', event => {
    if (!storyVideoActive || event.code !== 'Space') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    skipStoryVideo();
}, true);
