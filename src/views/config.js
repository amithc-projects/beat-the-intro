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
      <div class="pg-cfg view__inner">
        <div class="pg-hdr">
          <div class="pg-hdr__top">
            <div class="space-y-1">
              <p class="section-label" style="font-size:0.75rem; color:rgba(255,255,255,0.6)">Step 2 of 2</p>
              <h2 class="display-heading" style="font-size:1.8rem">Configure <span class="accent">Game</span></h2>
            </div>
          </div>
        </div>

        <div class="pg-cnt">
          <div class="playlist-hero">
            ${cover ? `<img src="${cover}" alt="${state.playlist.name}" class="playlist-hero__cover">` : ''}
          </div>

          <div class="config-options">
            <div class="space-y-6">
              <div class="playlist-identity">
                <h1 class="playlist-hero__name">${state.playlist.name}</h1>
                <p class="playlist-hero__tracks">${state.playlist.total} tracks</p>
              </div>

              <div>
                <p class="section-label">Number of rounds</p>
                <div class="seg-control" id="seg-rounds">
                  ${PRESET_ROUNDS.map(n => `
                    <button class="seg-control__btn${n === 5 ? ' is-active' : ''}" data-rounds="${n}">${n}</button>
                  `).join('')}
                  <button class="seg-control__btn" data-rounds="custom">Custom</button>
                </div>

                <div id="custom-rounds-wrap" style="display:none; margin-top:1rem">
                  <input id="custom-rounds-input" class="field__input" type="number" min="1" max="${state.playlist.total}" value="7" style="max-width:120px">
                  <p class="text-muted text-xs mt-2">Max ${state.playlist.total} (tracks in playlist)</p>
                </div>

                <p id="rounds-note" class="text-accent text-sm mt-4" style="display:none"></p>
              </div>
            </div>
          </div>
        </div>

        <div class="pg-btn">
          <button id="back-btn" class="btn btn--outline">
            <span class="material-symbols-outlined">arrow_back</span>
            Back to playlists
          </button>
          <button id="start-btn" class="btn btn--primary">
            <span class="material-symbols-outlined">play_arrow</span>
            Start Game
          </button>
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
