/** @type {boolean} */
let isMuted = false;
/** @type {HTMLAudioElement|null} */
let currentBgm = null;
/** @type {number} */
let bgmVolume = 0.25;
/** @type {number} */
let sfxVolume = 0.5;

/** Contains all background music and sound effects. */
const audioHub = {
    bgmMenu: new Audio('audio/bgm01.mp3'),
    bgmGame: new Audio('audio/bgm02.mp3'),
    bgmBoss: new Audio('audio/bgm03.mp3'),
    bgmLost: new Audio('audio/bgm04.mp3'),
    bgmWin: new Audio('audio/bgm05.mp3'),
    jump: new Audio('audio/jump.mp3'),
    run: new Audio('audio/run.mp3'),
    throw: new Audio('audio/throw.mp3'),
    coinCollect: new Audio('audio/coin.mp3'),
    bottleCollect: new Audio('audio/bottle.mp3'),
    pepeSnore: new Audio('audio/snoring.mp3'),
    smallChickenDead: new Audio('audio/chick-dead.mp3'),
    chickenStomp: new Audio('audio/chicken-stomp.mp3'),
    chickenDead1: new Audio('audio/chicken-dead1.mp3'),
    chickenDead: new Audio('audio/chicken-dead.mp3'),
    bossHurt: new Audio('audio/boss-hurt.mp3'),
    pepeHurt01: new Audio('audio/hurt01.mp3'),
    pepeHurt02: new Audio('audio/hurt02.mp3'),
    pepeHurt03: new Audio('audio/hurt03.mp3'),
    pepeDead01: new Audio('audio/dead01.mp3'),
    pepeDead02: new Audio('audio/dead02.mp3'),
    pepeDead03: new Audio('audio/dead03.mp3')
};

audioHub.run.loop = true;

/** Allows background music after user interaction. */
function unlockAudioOnFirstInteraction() {
    const resume = () => {
        resumeCurrentBgm();
        window.removeEventListener('click', resume);
        window.removeEventListener('keydown', resume);
    };
    window.addEventListener('click', resume);
    window.addEventListener('keydown', resume);
}

/** Loads the saved mute preference. */
function loadMutePreference() {
    const savedMute = localStorage.getItem('isMuted');
    if (savedMute !== null) isMuted = savedMute === 'true';
    updateMuteUI();
    applyMuteState();
}

/** Toggles and saves the mute preference. */
function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteUI();
    applyMuteState();
    if (!isMuted) resumeCurrentBgm();
}

/** Updates the Sound button image and accessible name. */
function updateMuteUI() {
    const soundBtn = document.getElementById('soundBtn');
    const soundIcon = document.getElementById('soundIcon');
    if (soundIcon) {
        soundIcon.src = isMuted ? 'img/sound-off.webp' : 'img/sound-on.webp';
        soundIcon.alt = isMuted ? 'Sound Off' : 'Sound On';
    }
    if (soundBtn) soundBtn.setAttribute('aria-label', isMuted ? 'Turn sound on' : 'Mute sound');
}

/** Applies mute state to all audio elements. */
function applyMuteState() {
    Object.values(audioHub).forEach(audio => audio.muted = isMuted);
    if (isMuted) stopSoundEffects();
    if (typeof syncStoryVideoMute === 'function') syncStoryVideoMute();
    if (typeof syncEndingRewardVideoAudio === 'function') syncEndingRewardVideoAudio();
}

/** Loads stored volume preferences. */
function loadVolumePreferences() {
    const savedBgm = parseFloat(localStorage.getItem('bgmVolume'));
    const savedSfx = parseFloat(localStorage.getItem('sfxVolume'));
    if (Number.isFinite(savedBgm)) bgmVolume = clampVolume(savedBgm);
    if (Number.isFinite(savedSfx)) sfxVolume = clampVolume(savedSfx);
    syncVolumeSliders();
}

/** @param {number} value @returns {number} The value limited to zero through one. */
function clampVolume(value) {
    return Math.min(1, Math.max(0, value));
}

/** Updates both volume sliders. */
function syncVolumeSliders() {
    const bgmSlider = document.getElementById('bgmSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    if (bgmSlider) bgmSlider.value = bgmVolume;
    if (sfxSlider) sfxSlider.value = sfxVolume;
}

/** @param {string} val The selected BGM volume. */
function changeBgmVolume(val) {
    const volume = parseFloat(val);
    if (!Number.isFinite(volume)) return;
    bgmVolume = clampVolume(volume);
    localStorage.setItem('bgmVolume', bgmVolume);
    if (currentBgm) currentBgm.volume = bgmVolume;
}

/** @param {string} val The selected sound-effect volume. */
function changeSfxVolume(val) {
    const volume = parseFloat(val);
    if (!Number.isFinite(volume)) return;
    sfxVolume = clampVolume(volume);
    localStorage.setItem('sfxVolume', sfxVolume);
    if (typeof syncEndingRewardVideoAudio === 'function') syncEndingRewardVideoAudio();
}

/**
 * Plays a background music track.
 * @param {HTMLAudioElement} bgmTrack The track to activate.
 * @param {boolean} [allowWhilePaused=false] Whether playback is allowed during Pause.
 */
function playBgm(bgmTrack, allowWhilePaused = false) {
    if (currentBgm === bgmTrack) return resumeCurrentBgm(allowWhilePaused);
    stopCurrentBgm();
    currentBgm = bgmTrack;
    if (!currentBgm) return;
    configureAndResumeBgm(allowWhilePaused);
}

/** Stops the current background track. */
function stopCurrentBgm() {
    if (!currentBgm) return;
    currentBgm.pause();
    currentBgm.currentTime = 0;
}

/** Configures and resumes the selected background track. */
function configureAndResumeBgm(allowWhilePaused) {
    currentBgm.loop = !playlistActive || playlistRepeat === 'track';
    currentBgm.volume = bgmVolume;
    currentBgm.muted = isMuted;
    resumeCurrentBgm(allowWhilePaused);
}

/** Resumes background music when its current game state permits it. */
function resumeCurrentBgm(allowWhilePaused = false) {
    if (!currentBgm || isMuted || (!allowWhilePaused && isPaused) || isStoryVideoPlaying()) return;
    if (currentBgm === audioHub.bgmMenu && !isMainMenuVisible()) return;
    if (!currentBgm.paused) return;
    currentBgm.play().catch(() => { });
}

/** @param {HTMLAudioElement} sound The sound effect to play. @returns {Promise<boolean>} Whether playback began. */
function playSound(sound) {
    if (!sound || isMuted || isPaused || isStoryVideoPlaying()) return Promise.resolve(false);
    sound.volume = sfxVolume;
    sound.muted = isMuted;
    sound.currentTime = 0;
    try {
        return sound.play().then(() => true).catch(() => false);
    } catch (error) {
        return Promise.resolve(false);
    }
}

/** @param {'hurt'|'dead'} type The requested Pepe voice category. @returns {HTMLAudioElement} A random matching voice. */
function getRandomPepeVoice(type) {
    let voices = type === 'hurt'
        ? [audioHub.pepeHurt01, audioHub.pepeHurt02, audioHub.pepeHurt03]
        : [audioHub.pepeDead01, audioHub.pepeDead02, audioHub.pepeDead03];
    return voices[Math.floor(Math.random() * voices.length)];
}

/** Stops any active Hurt line before Pepe changes state or takes another hit. */
function stopPepeHurtVoices() {
    [audioHub.pepeHurt01, audioHub.pepeHurt02, audioHub.pepeHurt03].forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
    });
}

/** Plays exactly one non-overlapping Hurt line. */
function playRandomPepeHurtVoice() {
    stopPepeHurtVoices();
    playSound(getRandomPepeVoice('hurt'));
}

/** @returns {{voice: HTMLAudioElement, playback: Promise<boolean>}} The selected death voice and its playback result. */
function playRandomPepeDeadVoice() {
    stopPepeHurtVoices();
    let voice = getRandomPepeVoice('dead');
    return { voice, playback: playSound(voice) };
}

/** Stops all sound effects except the current BGM. */
function stopSoundEffects() {
    Object.values(audioHub).forEach(audio => {
        if (audio === currentBgm) return;
        audio.pause();
        audio.currentTime = 0;
    });
}