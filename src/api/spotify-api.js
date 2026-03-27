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
