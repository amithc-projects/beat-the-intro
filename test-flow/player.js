// player.js - Spotify Web Playback SDK integration
import { getAccessToken, refreshToken, isTokenExpired } from './auth.js';

let player;
let deviceId;
let resolvePlayerReady;
let rejectPlayerReady;
const playerReadyPromise = new Promise((resolve, reject) => {
    resolvePlayerReady = resolve;
    rejectPlayerReady = reject;
});

// External log callback — set by main.js
let _log = (level, msg) => console.log(`[${level}] ${msg}`);
export function setLogCallback(fn) { _log = fn; }

// Define callback at top level so it's ready when the script loads
window.onSpotifyWebPlaybackSDKReady = () => {
    _log('info', 'onSpotifyWebPlaybackSDKReady fired — SDK loaded OK');

    player = new window.Spotify.Player({
        name: 'Beat the Intro Player',
        getOAuthToken: async (cb) => {
            _log('info', 'getOAuthToken called by SDK');
            try {
                if (isTokenExpired()) {
                    _log('warn', 'Token expired — refreshing...');
                    await refreshToken();
                }
                const token = getAccessToken();
                _log('info', `Token provided to SDK (length: ${token?.length ?? 0})`);
                cb(token);
            } catch (e) {
                _log('error', `getOAuthToken failed: ${e.message}`);
                cb(null);
            }
        },
        volume: 0.5
    });

    player.addListener('ready', ({ device_id }) => {
        _log('success', `SDK ready — device_id: ${device_id}`);
        deviceId = device_id;
        if (resolvePlayerReady) resolvePlayerReady(device_id);

        // iOS: poll every 250ms to re-resume any AudioContext that iOS auto-suspends
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            _log('info', 'iOS detected — starting AudioContext resume heartbeat');
            setInterval(() => {
                for (const ctx of (window.__audioContexts || [])) {
                    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
                }
            }, 250);
        }
    });

    player.addListener('not_ready', ({ device_id }) => {
        _log('warn', `Device went offline — device_id: ${device_id}`);
    });

    player.addListener('initialization_error', ({ message }) => {
        _log('error', `initialization_error: ${message}`);
        rejectPlayerReady(new Error(`SDK init error: ${message}`));
    });

    player.addListener('authentication_error', ({ message }) => {
        _log('error', `authentication_error: ${message}`);
    });

    player.addListener('account_error', ({ message }) => {
        _log('error', `account_error (Premium required?): ${message}`);
    });

    player.addListener('playback_error', ({ message }) => {
        _log('error', `playback_error: ${message}`);
    });

    player.addListener('player_state_changed', (state) => {
        if (!state) {
            _log('warn', 'player_state_changed: null state (player disconnected?)');
            return;
        }
        const track = state.track_window?.current_track;
        _log('info', `state_changed: paused=${state.paused} track="${track?.name ?? 'none'}"`);
    });

    _log('info', 'Calling player.connect()...');
    player.connect().then(success => {
        _log(success ? 'success' : 'error', `player.connect() resolved: ${success}`);
    }).catch(e => {
        _log('error', `player.connect() threw: ${e.message}`);
    });
};

// Timeout fallback if SDK script never fires
setTimeout(() => {
    if (!deviceId) {
        _log('error', 'Timeout: onSpotifyWebPlaybackSDKReady never fired after 8s — SDK may be blocked or unsupported in this browser');
        rejectPlayerReady(new Error('SDK timeout'));
    }
}, 8000);

export async function initPlayer(onStateChange) {
    if (player && onStateChange) {
        player.addListener('player_state_changed', onStateChange);
    }
    return playerReadyPromise;
}

// Resume any AudioContexts the SDK created (iOS suspends them automatically)
export function resumeAudio() {
    const contexts = window.__audioContexts || [];
    for (const ctx of contexts) {
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    }
    const states = contexts.map(c => c.state).join(', ');
    if (contexts.length) _log('info', `AudioContext states: [${states}]`);
}

export async function playTrack(uri) {
    if (!deviceId) throw new Error('Player not ready — no device_id');

    resumeAudio();
    _log('info', `playTrack: ${uri}`);
    const token = getAccessToken();

    const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [uri] }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok && res.status !== 204) {
        const body = await res.text().catch(() => '');
        _log('error', `play API ${res.status}: ${body}`);
        throw new Error(`Play API failed: ${res.status}`);
    }
    _log('success', `play API responded ${res.status}`);
}

export async function pause() {
    if (player) await player.togglePlay();
}
