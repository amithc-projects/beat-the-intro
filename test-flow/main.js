// main.js - Main logic for the standalone test page
import { redirectToSpotify, getToken, getAccessToken } from './auth.js';
import { getUserPlaylists, getPlaylistTracks } from './api.js';
import { initPlayer, playTrack, setLogCallback } from './player.js';

// ── Diagnostic log ────────────────────────────────────────────────────────────
const diagLog = document.getElementById('diag-log');
const diagEnv = document.getElementById('diag-env');
const logLines = [];

function log(level, msg) {
    const ts = new Date().toISOString().substr(11, 12);
    const colors = { info: '#ccc', success: '#D1FF00', warn: '#ffcc00', error: '#ff6b6b' };
    const labels = { info: 'INF', success: 'OK ', warn: 'WRN', error: 'ERR' };
    const color = colors[level] || '#ccc';
    const label = labels[level] || '   ';
    const line = `[${ts}] ${label} ${msg}`;
    logLines.push(line);

    const el = document.createElement('div');
    el.style.color = color;
    el.style.borderBottom = '1px solid #1a1a1a';
    el.style.paddingBottom = '2px';
    el.textContent = line;
    diagLog.appendChild(el);
    diagLog.scrollTop = diagLog.scrollHeight;
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](line);
}

setLogCallback(log);

// ── Diagnostic panel controls ─────────────────────────────────────────────────
let diagCollapsed = false;
document.getElementById('diag-toggle').onclick = () => {
    const panel = document.getElementById('diag-panel');
    diagCollapsed = !diagCollapsed;
    panel.style.height = diagCollapsed ? '32px' : '280px';
    document.getElementById('diag-toggle').textContent = diagCollapsed ? 'Show' : 'Hide';
};

document.getElementById('diag-copy').onclick = () => {
    const text = logLines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        document.getElementById('diag-copy').textContent = 'Copied!';
        setTimeout(() => { document.getElementById('diag-copy').textContent = 'Copy'; }, 2000);
    }).catch(() => {
        // Fallback for browsers where clipboard API needs user gesture
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        document.getElementById('diag-copy').textContent = 'Copied!';
        setTimeout(() => { document.getElementById('diag-copy').textContent = 'Copy'; }, 2000);
    });
};

document.getElementById('diag-clear').onclick = () => {
    logLines.length = 0;
    diagLog.innerHTML = '';
};

// ── Browser environment detection ─────────────────────────────────────────────
function detectEnv() {
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isChrome = /Chrome/.test(ua) || /Chromium/.test(ua);
    const browser = isSafari ? 'Safari' : isFirefox ? 'Firefox' : isChrome ? 'Chrome' : 'Unknown';
    const platform = isIOS ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(navigator.platform || '') ? 'macOS' : 'Other';

    diagEnv.textContent = `${browser} / ${platform}`;
    diagEnv.style.color = (isSafari || isIOS) ? '#ff6b6b' : '#D1FF00';

    log('info', `Browser: ${browser}, Platform: ${platform}`);
    log('info', `UA: ${ua}`);
    log('info', `navigator.platform: ${navigator.platform}`);

    // Check EME support (required by Spotify SDK)
    const hasEME = !!window.MediaKeys || !!window.WebKitMediaKeys || !!window.MSMediaKeys;
    const hasRequestMK = !!(HTMLVideoElement?.prototype?.webkitSetMediaKeys || HTMLVideoElement?.prototype?.setMediaKeys || HTMLMediaElement?.prototype?.setMediaKeys);
    log(hasEME ? 'success' : 'warn', `EME (MediaKeys) available: ${hasEME}`);
    log(hasRequestMK ? 'success' : 'warn', `setMediaKeys on HTMLMediaElement: ${hasRequestMK}`);

    // Check Web Audio API
    const hasWebAudio = !!(window.AudioContext || window.webkitAudioContext);
    log(hasWebAudio ? 'success' : 'error', `Web Audio API available: ${hasWebAudio}`);

    // Check MSE (Media Source Extensions)
    const hasMSE = !!window.MediaSource;
    log(hasMSE ? 'success' : 'warn', `MediaSource Extensions (MSE): ${hasMSE}`);

    if (isSafari || isIOS) {
        log('warn', '⚠ Safari/iOS detected — Spotify Web Playback SDK is NOT officially supported on this browser. The SDK requires EME + MSE which Safari does not fully expose.');
        log('warn', 'open.spotify.com uses native app integration or HLS, bypassing the SDK entirely.');
    }

    // Check SDK script loaded
    const sdkScriptLoaded = !!window.Spotify;
    log(sdkScriptLoaded ? 'success' : 'warn', `window.Spotify available at startup: ${sdkScriptLoaded}`);
    log('info', `window.onSpotifyWebPlaybackSDKReady set: ${typeof window.onSpotifyWebPlaybackSDKReady === 'function'}`);
}

// ── Views ─────────────────────────────────────────────────────────────────────
const loginView = document.getElementById('login-view');
const playlistView = document.getElementById('playlist-view');
const playerView = document.getElementById('player-view');
const statusText = document.getElementById('status-text');
const playlistList = document.getElementById('playlist-list');
const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');
const albumArt = document.getElementById('album-art');

let currentTracks = [];
let currentPlaylistId = null;

function setStatus(msg) {
    statusText.innerText = msg;
    log('info', `STATUS: ${msg}`);
}

async function init() {
    detectEnv();

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        setStatus('AUTHENTICATING...');
        try {
            const data = await getToken(code);
            log(data.access_token ? 'success' : 'error', `Token exchange: ${data.access_token ? 'OK' : `FAILED — ${JSON.stringify(data)}`}`);
        } catch (e) {
            log('error', `Token exchange threw: ${e.message}`);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = getAccessToken();
    log(token ? 'success' : 'warn', `Access token in localStorage: ${token ? `present (length ${token.length})` : 'none'}`);

    if (token) {
        showPlaylists();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginView.classList.remove('hidden');
    playlistView.classList.add('hidden');
    playerView.classList.add('hidden');
    setStatus('WAITING FOR LOGIN');
}

async function showPlaylists() {
    setStatus('FETCHING PLAYLISTS...');
    loginView.classList.add('hidden');
    playlistView.classList.remove('hidden');
    playerView.classList.add('hidden');

    try {
        log('info', 'Calling getUserPlaylists...');
        const playlists = await getUserPlaylists();
        log('success', `Got ${playlists.length} playlists`);
        renderPlaylists(playlists);
        setStatus('SELECT A PLAYLIST');
    } catch (error) {
        setStatus('ERROR FETCHING PLAYLISTS');
        log('error', `getUserPlaylists failed: ${error.message}`);
    }
}

function renderPlaylists(playlists) {
    playlistList.innerHTML = '';
    playlists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
            <img src="${playlist.images[0]?.url || ''}" alt="${playlist.name}">
            <div class="name">${playlist.name}</div>
            <div class="tracks">${playlist.tracks.total} TRACKS</div>
        `;
        card.onclick = () => selectPlaylist(playlist.id);
        playlistList.appendChild(card);
    });
}

async function selectPlaylist(id) {
    setStatus('LOADING TRACKS...');
    currentPlaylistId = id;
    try {
        log('info', `Loading tracks for playlist ${id}`);
        currentTracks = await getPlaylistTracks(id);
        log('success', `Loaded ${currentTracks.length} tracks`);

        if (currentTracks.length === 0) {
            alert('This playlist has no tracks!');
            return;
        }

        setStatus('INITIALIZING PLAYER...');
        log('info', 'Calling initPlayer...');

        let deviceId;
        try {
            deviceId = await initPlayer((state) => {
                log('info', `player_state_changed: paused=${state?.paused}`);
            });
            log('success', `initPlayer resolved — device_id: ${deviceId}`);
        } catch (e) {
            log('error', `initPlayer rejected: ${e.message}`);
            setStatus('SDK FAILED — SEE LOG');
            return;
        }

        playRandomTrack();
    } catch (error) {
        setStatus('ERROR LOADING TRACKS');
        log('error', `selectPlaylist failed: ${error.message}`);
    }
}

async function playRandomTrack() {
    if (currentTracks.length === 0) return;

    setStatus('PLAYING...');
    playlistView.classList.add('hidden');
    playerView.classList.remove('hidden');
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        document.getElementById('ios-hint').classList.remove('hidden');
    }

    const randomIndex = Math.floor(Math.random() * currentTracks.length);
    const track = currentTracks[randomIndex];

    trackName.innerText = track.name;
    artistName.innerText = track.artists.map(a => a.name).join(', ');
    albumArt.src = track.album.images[0]?.url || '';

    log('info', `Attempting to play: "${track.name}" (${track.uri})`);

    try {
        await playTrack(track.uri);
        setStatus('ENJOY!');
    } catch (error) {
        if (error.message.startsWith('NO_SPOTIFY_APP')) {
            setStatus('OPEN SPOTIFY APP');
            log('warn', 'iOS: no Spotify app device found — open the Spotify app on this device so it appears as a Connect target, then try again');
        } else {
            setStatus('PLAYBACK ERROR — SEE LOG');
            log('error', `playTrack failed: ${error.message}`);
        }
    }
}

// Event Listeners
document.getElementById('login-btn').onclick = redirectToSpotify;
document.getElementById('play-random-btn').onclick = playRandomTrack;
document.getElementById('back-to-playlists-btn').onclick = showPlaylists;

init();
