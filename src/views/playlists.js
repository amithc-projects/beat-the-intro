import { navigate } from '../router.js'
import { getPlaylists } from '../api/spotify-api.js'
import { state } from '../state.js'
import { showToast } from '../components/toast.js'
import { track } from '../events.js'

const app = document.getElementById('app')

export async function renderPlaylists() {
  app.innerHTML = `
    <div class="view">
      <div class="view__inner view__inner--wide space-y-6">
        <div>
          <p class="section-label">Step 1 of 2</p>
          <h2 class="display-heading mt-2">Pick a <span class="accent">Playlist</span></h2>
        </div>
        <div id="playlist-grid" class="playlist-grid">
          ${Array(6).fill(0).map(() => `
            <div class="playlist-card">
              <div class="skeleton" style="width:100%;aspect-ratio:1"></div>
              <div class="playlist-card__body">
                <div class="skeleton" style="height:14px;width:70%;margin-bottom:8px"></div>
                <div class="skeleton" style="height:10px;width:40%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `

  try {
    const playlists = await getPlaylists()
    renderGrid(playlists)
  } catch (err) {
    console.error(err)
    showToast('Could not load playlists', 'error')
  }
}

function renderGrid(playlists) {
  const grid = document.getElementById('playlist-grid')
  if (!grid) return
  grid.innerHTML = playlists.map(pl => `
    <div class="playlist-card" data-id="${pl.id}" data-name="${escHtml(pl.name)}" data-total="${pl.tracks.total}">
      <img
        class="playlist-card__image"
        src="${pl.images?.[0]?.url || ''}"
        alt="${escHtml(pl.name)}"
        loading="lazy"
      >
      <div class="playlist-card__body">
        <p class="playlist-card__name">${escHtml(pl.name)}</p>
        <p class="playlist-card__count">${pl.tracks.total} tracks</p>
      </div>
    </div>
  `).join('')

  grid.querySelectorAll('.playlist-card').forEach(card => {
    card.addEventListener('click', () => {
      const id   = card.dataset.id
      const name = card.dataset.name
      const total = parseInt(card.dataset.total, 10)
      state.playlist = { id, name, total, images: [] }
      // Store cover image
      const img = card.querySelector('img')
      if (img) state.playlist.images = [{ url: img.src }]
      track('playlist_selected', { id, name, trackCount: total })
      navigate('/config')
    })
  })
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
