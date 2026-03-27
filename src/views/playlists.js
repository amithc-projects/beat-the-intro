import { navigate } from '../router.js'
import { getPlaylists } from '../api/spotify-api.js'
import { state } from '../state.js'
import { showToast } from '../components/toast.js'
import { track } from '../events.js'

const app = document.getElementById('app')
let allPlaylists = [] // Cache for filtering

export async function renderPlaylists() {
  const savedSearch = localStorage.getItem('bti_playlist_search') || ''

  app.innerHTML = `
    <div class="view">
      <div class="view__inner view__inner--wide space-y-6">
        <div class="playlist-header">
          <div>
            <p class="section-label">Step 1 of 2</p>
            <h2 class="display-heading mt-2">Pick a <span class="accent">Playlist</span></h2>
          </div>

          <div id="search-container" class="search-container ${savedSearch ? 'is-active' : ''}">
            <div class="search-input-wrapper">
              <input
                type="text"
                id="search-input"
                class="search-input"
                placeholder="SEARCH..."
                value="${escHtml(savedSearch)}"
                autocomplete="off"
              >
            </div>
            <button id="search-toggle" class="search-btn" title="Search">
              <span class="material-symbols-outlined">search</span>
            </button>
          </div>
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

  const searchInput = document.getElementById('search-input')
  const searchToggle = document.getElementById('search-toggle')
  const searchContainer = document.getElementById('search-container')

  searchToggle.addEventListener('click', () => {
    const wasActive = searchContainer.classList.contains('is-active')
    searchContainer.classList.toggle('is-active')

    if (!wasActive) {
      searchInput.focus()
    } else {
      searchInput.value = ''
      localStorage.removeItem('bti_playlist_search')
      renderGrid(allPlaylists)
    }
  })

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase()
    localStorage.setItem('bti_playlist_search', e.target.value)
    filterAndRender(term)
  })

  try {
    allPlaylists = await getPlaylists()
    if (savedSearch) {
      filterAndRender(savedSearch.toLowerCase())
    } else {
      renderGrid(allPlaylists)
    }
  } catch (err) {
    console.error(err)
    showToast('Could not load playlists', 'error')
  }
}

function filterAndRender(term) {
  const filtered = allPlaylists.filter(pl =>
    pl.name.toLowerCase().includes(term)
  )
  renderGrid(filtered)
}

function renderGrid(playlists) {
  const grid = document.getElementById('playlist-grid')
  if (!grid) return

  if (playlists.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 0; text-align: center;">
        <p class="text-muted uppercase tracking-wide font-bold">No playlists found matching your search.</p>
      </div>`
    return
  }

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
