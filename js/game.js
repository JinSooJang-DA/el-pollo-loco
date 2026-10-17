/**
 * Main game canvas element.
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * Global game world instance.
 * @type {World}
 */
let world;

/**
 * Keyboard input tracking instance.
 * @type {Keyboard}
 */
let keyboard = new Keyboard();

/**
 * Sound mute state flag.
 * @type {boolean}
 */
let isMuted = false;

/**
 * Currently playing background music track.
 * @type {HTMLAudioElement|null}
 */
let currentBgm = null;

/**
 * 현재 설정된 BGM 볼륨 (기본값 0.5)
 * @type {number}
 */
let bgmVolume = 0.5;

/**
 * 현재 설정된 SFX 볼륨 (기본값 0.5)
 * @type {number}
 */
let sfxVolume = 0.5;

/**
 * 설정 모달을 엽니다.
 */
function openSettingsDialog() {
    document.getElementById('settingsDialog').classList.remove('d-none');
}

/**
 * 설정 모달을 닫습니다.
 */
function closeSettingsDialog() {
    document.getElementById('settingsDialog').classList.add('d-none');
}

/**
 * 배경 클릭 시 설정 모달을 닫습니다.
 * @param {MouseEvent} event 
 */
function closeSettingsOnBackdrop(event) {
    if (event.target.id === 'settingsDialog') {
        closeSettingsDialog();
    }
}

/**
 * BGM 볼륨을 변경하고 저장합니다.
 * @param {string} val 
 */
function changeBgmVolume(val) {
    bgmVolume = parseFloat(val);
    localStorage.setItem('bgmVolume', bgmVolume);
    if (currentBgm) {
        currentBgm.volume = bgmVolume;
    }
}

/**
 * SFX 효과음 볼륨을 변경하고 저장합니다.
 * @param {string} val 
 */
function changeSfxVolume(val) {
    sfxVolume = parseFloat(val);
    localStorage.setItem('sfxVolume', sfxVolume);
}

/**
 * 저장된 볼륨 설정을 불러옵니다. (init 내부에서 호출)
 */
function loadVolumePreferences() {
    let savedBgm = localStorage.getItem('bgmVolume');
    let savedSfx = localStorage.getItem('sfxVolume');

    if (savedBgm !== null) {
        bgmVolume = parseFloat(savedBgm);
        document.getElementById('bgmSlider').value = bgmVolume;
    }
    if (savedSfx !== null) {
        sfxVolume = parseFloat(savedSfx);
        document.getElementById('sfxSlider').value = sfxVolume;
    }
}

// playBgm 함수 안에서 볼륨 적용
function playBgm(bgmTrack) {
    if (currentBgm) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
    }
    currentBgm = bgmTrack;
    if (currentBgm) {
        currentBgm.loop = true;
        currentBgm.volume = bgmVolume; // 볼륨 반영
        currentBgm.currentTime = 0;
        if (!isMuted) {
            currentBgm.play().catch(() => {});
        }
    }
}

// playSound 함수 안에서 효과음 볼륨 적용
function playSound(sound) {
    if (!isMuted && sound) {
        sound.volume = sfxVolume; // 볼륨 반영
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

/**
 * Audio hub mapping exact file names from the audio directory.
 * @type {Object.<string, HTMLAudioElement>}
 */
const AUDIO_HUB = {
    // 5가지 BGM (스크린샷 bgm01 ~ bgm05 매칭)
    bgmMenu: new Audio('audio/bgm01.mp3'), // 1. 최초 화면 대기
    bgmGame: new Audio('audio/bgm02.mp3'), // 2. 닭/병아리 몬스터 단계
    bgmBoss: new Audio('audio/bgm03.mp3'), // 3. 보스 대면 상태
    bgmLost: new Audio('audio/bgm04.mp3'), // 4. 보스 패배 시
    bgmWin: new Audio('audio/bgm05.mp3'),  // 5. 보스 승리 시

    // 효과음 (SFX) - 스크린샷 실제 파일명 정확히 반영
    jump: new Audio('audio/jump.mp3'),
    throw: new Audio('audio/throw.mp3'),
    bottleSplash: new Audio('audio/splash.mp3'),
    coinCollect: new Audio('audio/coin.mp3'),
    bottleCollect: new Audio('audio/bottle.mp3'),
    pepeSnore: new Audio('audio/snoring.mp3'),
    smallChickenDead: new Audio('audio/chick-dead.mp3'),
    chickenDead: new Audio('audio/chicken-dead.mp3'),
    bossHurt: new Audio('audio/boss-hurt.mp3'),
    pepeHurt: new Audio('audio/hurt.mp3'),
    pepeDead: new Audio('audio/dead.mp3')
};

/**
 * Initializes the canvas, loads mute preferences, and registers touch events.
 */
function init() {
    canvas = document.getElementById('canvas');
    loadMutePreference();
    loadVolumePreferences(); // 볼륨 설정 로드 추가
    bindTouchEvents();
    playBgm(AUDIO_HUB.bgmMenu);
}

/**
 * 게임 일시정지 상태 여부
 * @type {boolean}
 */
let isPaused = false;

/**
 * 게임 일시정지 / 재개 토글 함수
 */
function togglePause() {
    isPaused = !isPaused;
    let pauseScreen = document.getElementById('pauseScreen');
    let pauseBtn = document.getElementById('pauseBtn');

    if (isPaused) {
        pauseScreen.classList.remove('d-none');
        pauseBtn.innerText = '▶️';
        if (currentBgm) currentBgm.pause();
        if (AUDIO_HUB.pepeSnore) AUDIO_HUB.pepeSnore.pause(); // 일시정지 시 코골이 즉시 멈춤!
    } else {
        pauseScreen.classList.add('d-none');
        pauseBtn.innerText = '⏸️';
        if (currentBgm && !isMuted) currentBgm.play().catch(() => {});
    }
}

/**
 * Loads the stored mute state from localStorage and updates UI.
 */
function loadMutePreference() {
    let savedMute = localStorage.getItem('isMuted');
    if (savedMute !== null) {
        isMuted = savedMute === 'true';
    }
    updateMuteUI();
    applyMuteState();
}

/**
 * Toggles audio mute state and stores the choice in localStorage.
 */
function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteUI();
    applyMuteState();
}

/**
 * Updates the sound toggle button icon in the UI.
 */
function updateMuteUI() {
    let soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.innerText = isMuted ? '🔇' : '🔊';
    }
}

/**
 * Applies the current mute state to all audio elements in AUDIO_HUB.
 */
function applyMuteState() {
    Object.values(AUDIO_HUB).forEach(audio => {
        audio.muted = isMuted;
    });
}

/**
 * Plays a specific BGM track with loop enabled.
 * @param {HTMLAudioElement} bgmTrack - The BGM track to play.
 */
function playBgm(bgmTrack) {
    if (currentBgm) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
    }
    currentBgm = bgmTrack;
    if (currentBgm) {
        currentBgm.loop = true;
        currentBgm.currentTime = 0;
        if (!isMuted) {
            currentBgm.play().catch(() => {});
        }
    }
}

/**
 * Plays an individual sound effect.
 * @param {HTMLAudioElement} sound - Sound effect element.
 */
function playSound(sound) {
    if (!isMuted && sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

/**
 * Starts the game, switches to normal stage BGM, and creates the world.
 */
function startGame() {
    document.getElementById('startScreen').classList.add('d-none');
    initLevel();
    world = new World(canvas, keyboard);
    playBgm(AUDIO_HUB.bgmGame);
}

/**
 * Clears all active interval timers across the window.
 */
function stopAllIntervals() {
    for (let i = 1; i < 9999; i++) {
        window.clearInterval(i);
    }
}

/**
 * Restarts the game, resetting world state and game BGM.
 */
function restartGame() {
    stopAllIntervals();
    document.getElementById('restartScreen').classList.add('d-none');
    initLevel();
    world = new World(canvas, keyboard);
    playBgm(AUDIO_HUB.bgmGame);
}

/**
 * Returns to the main menu and plays menu BGM.
 */
function backToMainMenu() {
    stopAllIntervals();
    document.getElementById('restartScreen').classList.add('d-none');
    document.getElementById('startScreen').classList.remove('d-none');
    world = null;
    playBgm(AUDIO_HUB.bgmMenu);
}

/**
 * Opens the controls and rules modal dialog.
 */
function openInfoDialog() {
    document.getElementById('infoDialog').classList.remove('d-none');
}

/**
 * Closes the controls and rules modal dialog.
 */
function closeInfoDialog() {
    document.getElementById('infoDialog').classList.add('d-none');
}

/**
 * Closes dialog modal when clicking on backdrop.
 * @param {MouseEvent} event - Click event.
 */
function closeOnBackdrop(event) {
    if (event.target.id === 'infoDialog') {
        closeInfoDialog();
    }
}

/**
 * Opens the impressum page in a new browser tab.
 */
function openImpressum() {
    window.open('impressum.html', '_blank');
}

/**
 * Toggles fullscreen display for the game container.
 */
function toggleFullscreen() {
    let container = document.getElementById('gameContainer');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

/**
 * Binds touch events and prevents context menu popups on mobile buttons.
 * @param {string} btnId - Element ID of the touch button.
 * @param {string} keyProperty - Keyboard property name.
 */
function bindTouchButton(btnId, keyProperty) {
    let btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keyboard[keyProperty] = true;
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keyboard[keyProperty] = false;
    }, { passive: false });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * Binds all mobile touch controls.
 */
function bindTouchEvents() {
    bindTouchButton('btnLeft', 'LEFT');
    bindTouchButton('btnRight', 'RIGHT');
    bindTouchButton('btnJump', 'SPACE');
    bindTouchButton('btnThrow', 'D');
}

window.addEventListener('keydown', (e) => {
    if (e.keyCode === 39) keyboard.RIGHT = true;
    if (e.keyCode === 37) keyboard.LEFT = true;
    if (e.keyCode === 38) keyboard.UP = true;
    if (e.keyCode === 40) keyboard.DOWN = true;
    if (e.keyCode === 32) { keyboard.SPACE = true; playSound(AUDIO_HUB.jump); }
    if (e.keyCode === 68) { keyboard.D = true; playSound(AUDIO_HUB.throw); }
});

window.addEventListener('keyup', (e) => {
    if (e.keyCode === 39) keyboard.RIGHT = false;
    if (e.keyCode === 37) keyboard.LEFT = false;
    if (e.keyCode === 38) keyboard.UP = false;
    if (e.keyCode === 40) keyboard.DOWN = false;
    if (e.keyCode === 32) keyboard.SPACE = false;
    if (e.keyCode === 68) keyboard.D = false;
});