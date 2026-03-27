// player.js - Spotify Web Playback SDK integration
import { getAccessToken, refreshToken, isTokenExpired } from './auth.js';

let player;
let deviceId;
let resolvePlayerReady;
const playerReadyPromise = new Promise((resolve) => {
    resolvePlayerReady = resolve;
});

// Define callback at top level so it's ready when the script loads
window.onSpotifyWebPlaybackSDKReady = () => {
    player = new window.Spotify.Player({
        name: 'Beat the Intro Player',
        getOAuthToken: async (cb) => {
            if (isTokenExpired()) {
                await refreshToken();
            }
            cb(getAccessToken());
        },
        volume: 0.5
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceId = device_id;
        if (resolvePlayerReady) resolvePlayerReady(device_id);
    });

    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    player.connect();
};

export async function initPlayer(onStateChange) {
    if (player && onStateChange) {
        player.addListener('player_state_changed', onStateChange);
    }
    return playerReadyPromise;
}

export async function playTrack(uri) {
    if (!deviceId) throw new Error('Player not ready');
    
    const token = getAccessToken();
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [uri] }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
}

export async function pause() {
    if (player) await player.togglePlay();
}
