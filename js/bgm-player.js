
/** Start screen playlist state. */
let playlistActive = true;
let playlistTrack = 0;
let playlistShuffle = false;
let playlistRepeat = 'list';

const PLAYLIST_TRACKS = [
    AUDIO_HUB.bgmMenu,
    AUDIO_HUB.bgmGame,
    AUDIO_HUB.bgmBoss,
    AUDIO_HUB.bgmLost,
    AUDIO_HUB.bgmWin
];

/**
 * Selects and plays a soundtrack from the playlist.
 * @param {number} index The selected track index.
 */
function selectPlaylistTrack(index) {
    if (!playlistActive) return;
    playlistTrack = index;
    playBgm(PLAYLIST_TRACKS[index]);
    updatePlaylistUI();
}

/** Plays the next track. */
function playNextTrack() {
    if (playlistShuffle) {
        playlistTrack = getRandomTrack();
    } else {
        playlistTrack = (playlistTrack + 1) % PLAYLIST_TRACKS.length;
    }
    selectPlaylistTrack(playlistTrack);
}

/** Plays the previous track. */
function playPreviousTrack() {
    playlistTrack = (playlistTrack - 1 + PLAYLIST_TRACKS.length)
        % PLAYLIST_TRACKS.length;
    selectPlaylistTrack(playlistTrack);
}

/**
 * Returns a random track other than the current one.
 * @returns {number} A valid playlist index different from the current track.
 */
function getRandomTrack() {
    let next = Math.floor(Math.random() * (PLAYLIST_TRACKS.length - 1));
    if (next >= playlistTrack) next++;
    return next;
}

/** Toggles random playback. */
function togglePlaylistShuffle() {
    playlistShuffle = !playlistShuffle;
    updatePlaylistUI();
}

/** Changes the playlist repeat mode. */
function togglePlaylistRepeat() {
    const modes = ['track', 'list', 'off'];
    const next = (modes.indexOf(playlistRepeat) + 1) % modes.length;
    playlistRepeat = modes[next];
    updatePlaylistLoop();
    updatePlaylistUI();
}

/** Sets the audio element's repeat behavior. */
function updatePlaylistLoop() {
    if (currentBgm) {
        currentBgm.loop = playlistRepeat === 'track';
    }
}

/** Toggles playback of the selected song. */
function togglePlaylistPlayback() {
    if (!playlistActive || !currentBgm) return;
    if (currentBgm.paused) {
        resumeCurrentBgm();
    } else {
        currentBgm.pause();
    }
    updatePlaylistUI();
}

/** Updates playlist buttons and selected track. */
function updatePlaylistUI() {
    const tracks = document.querySelectorAll('.playlist-track');
    tracks.forEach((button, index) => {
        button.classList.toggle('is-playing', index === playlistTrack);
    });
    document.getElementById('bgmShuffleBtn').innerText =
        `Shuffle: ${playlistShuffle ? 'On' : 'Off'}`;
    document.getElementById('bgmRepeatBtn').innerText =
        `Repeat: ${playlistRepeat}`;
    updatePlaylistPlayButton();
}

/** Updates the play and pause button. */
function updatePlaylistPlayButton() {
    const button = document.getElementById('bgmPlayBtn');
    if (button && currentBgm) {
        button.innerText = currentBgm.paused ? '▶' : '⏸';
    }
}

/**
 * Continues the playlist after a song ends.
 * @param {Event} event The ended event from a soundtrack element.
 */
function handlePlaylistEnded(event) {
    if (!playlistActive || event.target !== currentBgm) return;
    if (playlistRepeat === 'list') playNextTrack();
    updatePlaylistUI();
}

/** Resets the playlist and starts the main theme. */
function resetPlaylist() {
    playlistActive = true;
    playlistTrack = 0;
    playlistShuffle = false;
    playlistRepeat = 'list';
    const menu = document.getElementById('bgmMenu');
    menu.classList.remove('d-none');
    menu.open = false;
    playBgm(AUDIO_HUB.bgmMenu);
    updatePlaylistUI();
}

/** Disables the playlist during gameplay. */
function deactivatePlaylist() {
    playlistActive = false;
    playlistTrack = 0;
    playlistShuffle = false;
    playlistRepeat = 'track';
    const menu = document.getElementById('bgmMenu');
    menu.open = false;
    menu.classList.add('d-none');
}

/** Registers the end event for each soundtrack. */
function initPlaylist() {
    PLAYLIST_TRACKS.forEach(track => {
        track.addEventListener('ended', handlePlaylistEnded);
    });
    updatePlaylistUI();
}
