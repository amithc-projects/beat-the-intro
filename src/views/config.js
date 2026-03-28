import { navigate } from '../router.js'
import { state } from '../state.js'
import { getPlaylistTracks } from '../api/spotify-api.js'
import { startGame } from '../game/game-engine.js'
import { initPlayer } from '../player/playback.js'
import { showToast } from '../components/toast.js'
import { track } from '../events.js'

const app = document.getElementById('app')
const PRESET_ROUNDS = [3, 5, 10]

export function renderConfig() {
  if (!state.playlist) { navigate('/playlists'); return }

  const cover = state.playlist.images?.[0]?.url || ''
  app.innerHTML = `
    <div class="view view--centered">
      <div class="lscape-config view__inner view__inner--wide">
        <!-- Grid Child 1: Heading -->
        <div class="lscape-row-header">
          <div class="lscape-row-header__top">
             <div class="space-y-1">
               <p class="section-label" style="font-size:0.75rem; color:rgba(255,255,255,0.6)">Step 2 of 2</p>
               <h2 class="display-heading" style="font-size:1.8rem">Configure <span class="accent">Game</span></h2>
             </div>
          </div>
        </div>

        <!-- Grid Child 2: Main Content -->
        <div class="lscape-main-content" style="gap:2rem">
          <div class="card playlist-hero">
            ${cover ? `<img src="${cover}" alt="${state.playlist.name}" class="playlist-hero__cover" style="width:100px;height:100px;object-fit:cover;flex-shrink:0;display:block">` : ''}
            <div class="playlist-hero__info">
              <p style="font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;margin:0">${state.playlist.name}</p>
              <p class="section-label mt-2" id="track-availability">${state.playlist.total} tracks</p>
            </div>
          </div>

          <div class="space-y-4" style="width:100%">
            <p class="section-label">Number of rounds</p>
            <div class="seg-control" id="seg-rounds">
              ${PRESET_ROUNDS.map(n => `
                <button class="seg-control__btn${n === 5 ? ' is-active' : ''}" data-rounds="${n}">${n}</button>
              `).join('')}
              <button class="seg-control__btn" data-rounds="custom">Custom</button>
            </div>
            <div id="custom-rounds-wrap" style="display:none">
              <input id="custom-rounds-input" class="field__input" type="number" min="1" max="${state.playlist.total}" value="7" style="max-width:120px">
              <p class="text-muted text-xs mt-2">Max ${state.playlist.total} (tracks in playlist)</p>
            </div>
          </div>
        </div>

        <!-- Grid Child 3: Buttons (Footer) -->
        <div class="lscape-row-buttons" style="flex-direction:column; padding-top:2rem">
          <button id="start-btn" class="btn btn--primary btn--full" style="margin-bottom:0.75rem">
            <span class="material-symbols-outlined">play_arrow</span>
            Start Game
          </button>
          <button id="back-btn" class="btn btn--ghost btn--full">Back to Playlists</button>
        </div>
      </div>
    </div>
  `

  let selectedRounds = 5

  const seg = document.getElementById('seg-rounds')
  const customWrap = document.getElementById('custom-rounds-wrap')
  const customInput = document.getElementById('custom-rounds-input')
  const note = document.getElementById('rounds-note')

  seg.addEventListener('click', e => {
    const btn = e.target.closest('[data-rounds]')
    if (!btn) return
    seg.querySelectorAll('.seg-control__btn').forEach(b => b.classList.remove('is-active'))
    btn.classList.add('is-active')
    if (btn.dataset.rounds === 'custom') {
      customWrap.style.display = 'block'
      selectedRounds = parseInt(customInput.value, 10) || 5
    } else {
      customWrap.style.display = 'none'
      selectedRounds = parseInt(btn.dataset.rounds, 10)
    }
  })

  customInput.addEventListener('input', () => {
    selectedRounds = Math.max(1, Math.min(state.playlist.total, parseInt(customInput.value, 10) || 1))
  })

  document.getElementById('back-btn').addEventListener('click', () => navigate('/playlists'))

  document.getElementById('start-btn').addEventListener('click', async () => {
    const btn = document.getElementById('start-btn')
    btn.disabled = true
    btn.textContent = 'Loading...'

    try {
      const tracks = await getPlaylistTracks(state.playlist.id, state.user?.country)
      if (tracks.length === 0) {
        showToast('No playable tracks in this playlist', 'error')
        navigate('/playlists')
        return
      }

      const effective = Math.min(selectedRounds, tracks.length)
      if (effective < selectedRounds) {
        note.textContent = `Only ${tracks.length} playable tracks — game will use ${effective} rounds.`
        note.style.display = 'block'
      }

      startGame(state.playlist, tracks, effective)
      track('game_started', { playlistId: state.playlist.id, rounds: effective })

      // Init SDK in background — playing.js will await it
      initPlayer(null)

      navigate('/play')
    } catch (err) {
      console.error(err)
      showToast('Failed to load tracks', 'error')
      btn.disabled = false
      btn.textContent = 'Start Game'
    }
  })
}
