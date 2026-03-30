import { getAccessToken, isTokenExpired, refreshToken } from '../auth/spotify-auth.js'

async function apiFetch(url) {
  if (isTokenExpired()) await refreshToken()
  const token = getAccessToken()
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${url}`)
  return res.json()
}

async function fetchAll(url) {
  let items = [], next = url
  while (next) {
    const data = await apiFetch(next)
    items = items.concat(data.items)
    next = data.next
  }
  return items
}

export async function getUser() {
  return apiFetch('https://api.spotify.com/v1/me')
}

export async function getPlaylists() {
  return fetchAll('https://api.spotify.com/v1/me/playlists?limit=50')
}

export async function getTracks(ids) {
  const results = []
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const data = await apiFetch(`https://api.spotify.com/v1/tracks?ids=${chunk.join(',')}`)
    results.push(...data.tracks)
  }
  return results.filter(Boolean)
}

export async function getPlaylistTracks(playlistId, market) {
  const marketParam = market ? `&market=${market}` : ''
  const items = await fetchAll(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50${marketParam}`
  )
  return items
    .filter(item => item.track && !item.track.is_local && item.track.is_playable !== false)
    .map(item => item.track)
}

export async function getDevices() {
  return apiFetch('https://api.spotify.com/v1/me/player/devices')
}

export async function stopOnDevice(deviceId) {
  if (isTokenExpired()) await refreshToken()
  const token = getAccessToken()
  const res = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  // 403 = not playing, 404 = no active device — both are fine to ignore
  if (!res.ok && res.status !== 204 && res.status !== 403 && res.status !== 404) {
    console.warn(`stopOnDevice got ${res.status}`)
  }
}

export async function playOnDevice(deviceId, trackUri) {
  if (isTokenExpired()) await refreshToken()
  const token = getAccessToken()
  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [trackUri] }),
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(`Spotify playOnDevice failed: ${res.status}`)
  }
}
