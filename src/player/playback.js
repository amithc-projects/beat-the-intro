import { getAccessToken, isTokenExpired, refreshToken } from '../auth/spotify-auth.js'

import { state } from '../state.js'

let player = null
let deviceId = null // Local SDK device ID
let sdkReady = false

// Resolve when device_id is available — callers await this
let resolveReady
const readyPromise = new Promise(resolve => { resolveReady = resolve })

// ── SDK callback — MUST be defined at module top-level ────────────────────────
// This fires when the Spotify SDK script is loaded. Because this module is
// imported before any interaction happens, the callback is registered in time.
window.onSpotifyWebPlaybackSDKReady = () => {
  player = new window.Spotify.Player({
    name: 'Beat the Intro',
    getOAuthToken: async cb => {
      if (isTokenExpired()) await refreshToken()
      cb(getAccessToken())
    },
    volume: 0.8,
  })

  player.addListener('ready', ({ device_id }) => {
    deviceId = device_id
    sdkReady = true
    resolveReady({ deviceId: device_id, sdkReady: true })
  })

  player.addListener('not_ready', ({ device_id }) => {
    console.warn('Spotify player went offline', device_id)
    sdkReady = false
  })

  player.addListener('initialization_error', ({ message }) => {
    console.error('SDK init error', message)
    resolveReady({ deviceId: null, sdkReady: false })
  })

  player.addListener('authentication_error', ({ message }) => {
    console.error('SDK auth error', message)
  })

  player.connect()
}

// iOS/desktop fallback timeout — resolve as not-ready after 6s if SDK never fires
setTimeout(() => resolveReady({ deviceId: null, sdkReady: false }), 6000)

// ── Public API ────────────────────────────────────────────────────────────────
export async function initPlayer(onStateChange) {
  if (player && onStateChange) {
    player.addListener('player_state_changed', onStateChange)
  }
  return readyPromise
}

/**
 * Helper to call Spotify player API for the current target device.
 * This ensures that playback controls (play/pause/resume) work for BOTH
 * the local browser player AND remote Spotify Connect devices.
 */
async function playerApiCall(endpoint, method = 'PUT', body = null) {
  const targetDevice = state.activeDeviceId || deviceId
  if (!targetDevice) throw new Error('No active Spotify device selected')

  if (isTokenExpired()) await refreshToken()
  const token = getAccessToken()

  const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}?device_id=${targetDevice}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok && res.status !== 204) {
    throw new Error(`Spotify Player API (${endpoint}) failed: ${res.status}`)
  }
  return res
}

export async function playTrack(uri) {
  // Always use the API for starting a track to support Connect
  return playerApiCall('play', 'PUT', { uris: [uri] })
}

export async function pausePlayback() {
  // 1. Fast-path: pause local SDK immediately if playing locally
  if (player && !state.activeDeviceId) {
    try { await player.pause() } catch (e) { console.warn('Local pause failed', e) }
  }
  
  // 2. Definitive: tell Spotify API to pause the target device (SDK or Connect)
  return playerApiCall('pause', 'PUT')
}

export async function resumePlayback() {
  // 1. Fast-path: resume local SDK immediately if playing locally
  if (player && !state.activeDeviceId) {
    try { await player.resume() } catch (e) { console.warn('Local resume failed', e) }
  }

  // 2. Definitive: tell Spotify API to resume the target device (SDK or Connect)
  return playerApiCall('play', 'PUT')
}

export async function getCurrentState() {
  if (!player) return null
  return player.getCurrentState()
}

export function isSdkReady() {
  return sdkReady
}
