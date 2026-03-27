// api.js - Spotify Web API calls
import { getAccessToken, refreshToken, isTokenExpired } from './auth.js';

async function apiFetch(url) {
    if (isTokenExpired()) {
        await refreshToken();
    }
    const token = getAccessToken();
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return response.json();
}

export async function getUserPlaylists() {
    let allPlaylists = [];
    let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';
    
    while (nextUrl) {
        const data = await apiFetch(nextUrl);
        allPlaylists = allPlaylists.concat(data.items);
        nextUrl = data.next;
    }
    
    return allPlaylists;
}

export async function getPlaylistTracks(playlistId) {
    let allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    
    while (nextUrl) {
        const data = await apiFetch(nextUrl);
        allTracks = allTracks.concat(data.items);
        nextUrl = data.next;
    }
    
    // Filter out local tracks and Ensure we have track objects
    return allTracks
        .filter(item => item.track && !item.track.is_local)
        .map(item => item.track);
}
