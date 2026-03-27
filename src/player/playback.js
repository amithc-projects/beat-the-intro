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

export async function playTrack(uri) {
  const targetDevice = state.activeDeviceId || deviceId
  if (!targetDevice) throw new Error('No device available for playback')
  
  if (isTokenExpired()) await refreshToken()
  const token = getAccessToken()

  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${targetDevice}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [uri] }),
  })

  if (!res.ok && res.status !== 204) {
    throw new Error(`playTrack failed: ${res.status}`)
  }
}

export async function pausePlayback() {
  if (player) await player.pause()
}

export async function resumePlayback() {
  if (player) await player.resume()
}

export async function getCurrentState() {
  if (!player) return null
  return player.getCurrentState()
}

export function isSdkReady() {
  return sdkReady
}
