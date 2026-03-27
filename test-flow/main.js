// main.js - Main logic for the standalone test page
import { redirectToSpotify, getToken, getAccessToken } from './auth.js';
import { getUserPlaylists, getPlaylistTracks } from './api.js';
import { initPlayer, playTrack } from './player.js';

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

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        statusText.innerText = 'AUTHENTICATING...';
        await getToken(code);
        // Clear code from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = getAccessToken();
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
    statusText.innerText = 'WAITING FOR LOGIN';
}

async function showPlaylists() {
    statusText.innerText = 'FETCHING PLAYLISTS...';
    loginView.classList.add('hidden');
    playlistView.classList.remove('hidden');
    playerView.classList.add('hidden');

    try {
        const playlists = await getUserPlaylists();
        renderPlaylists(playlists);
        statusText.innerText = 'SELECT A PLAYLIST';
    } catch (error) {
        statusText.innerText = 'ERROR FETCHING PLAYLISTS';
        console.error(error);
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
    statusText.innerText = 'LOADING TRACKS...';
    currentPlaylistId = id;
    try {
        currentTracks = await getPlaylistTracks(id);
        if (currentTracks.length === 0) {
            alert('This playlist has no tracks!');
            return;
        }
        
        statusText.innerText = 'INITIALIZING PLAYER...';
        await initPlayer((state) => {
            console.log('Player state changed', state);
        });
        
        playRandomTrack();
    } catch (error) {
        statusText.innerText = 'ERROR LOADING TRACKS';
        console.error(error);
    }
}

async function playRandomTrack() {
    if (currentTracks.length === 0) return;
    
    statusText.innerText = 'PLAYING...';
    playlistView.classList.add('hidden');
    playerView.classList.remove('hidden');

    const randomIndex = Math.floor(Math.random() * currentTracks.length);
    const track = currentTracks[randomIndex];

    trackName.innerText = track.name;
    artistName.innerText = track.artists.map(a => a.name).join(', ');
    albumArt.src = track.album.images[0]?.url || '';

    try {
        await playTrack(track.uri);
        statusText.innerText = 'ENJOY!';
    } catch (error) {
        statusText.innerText = 'PLAYBACK ERROR (PREMIUM REQUIRED?)';
        console.error(error);
    }
}

// Event Listeners
document.getElementById('login-btn').onclick = redirectToSpotify;
document.getElementById('play-random-btn').onclick = playRandomTrack;
document.getElementById('back-to-playlists-btn').onclick = showPlaylists;

init();
