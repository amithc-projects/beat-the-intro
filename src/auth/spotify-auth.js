const CLIENT_ID   = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI

const SCOPES = 'streaming user-read-private user-read-email playlist-read-private user-modify-playback-state user-read-playback-state'

// ── PKCE helpers ───────────────────────────────────────────────────────────────
function generateCodeVerifier(length = 128) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => chars[b % chars.length]).join('')
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ── Public API ─────────────────────────────────────────────────────────────────
export async function redirectToSpotify() {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  localStorage.setItem('spotify_code_verifier', verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function handleCallback(code) {
  const verifier = localStorage.getItem('spotify_code_verifier')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  const data = await res.json()
  if (!data.access_token) throw new Error('Token exchange failed')

  localStorage.setItem('spotify_access_token',  data.access_token)
  localStorage.setItem('spotify_refresh_token', data.refresh_token)
  localStorage.setItem('spotify_token_expiry',  Date.now() + data.expires_in * 1000)
  localStorage.removeItem('spotify_code_verifier')
  return data
}

export async function refreshToken() {
  const refresh = localStorage.getItem('spotify_refresh_token')
  if (!refresh) throw new Error('No refresh token')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refresh,
    }),
  })

  const data = await res.json()
  if (!data.access_token) throw new Error('Refresh failed')

  localStorage.setItem('spotify_access_token', data.access_token)
  localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000)
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token)
  }
  return data.access_token
}

export function getAccessToken() {
  return localStorage.getItem('spotify_access_token')
}

export function isTokenExpired() {
  const expiry = localStorage.getItem('spotify_token_expiry')
  return !expiry || Date.now() > parseInt(expiry) - 60_000 // 60s buffer
}

export function logout() {
  ['spotify_access_token', 'spotify_refresh_token', 'spotify_token_expiry', 'spotify_code_verifier']
    .forEach(k => localStorage.removeItem(k))
}
