import { navigate } from '../router.js'
import { state } from '../state.js'
import { initPlayer } from '../player/playback.js'

const app = document.getElementById('app')

export async function renderReady() {
  if (!state.tracks.length) { navigate('/playlists'); return }

  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-8" style="text-align:center">
        <div>
          <p class="section-label">Shared game</p>
          <h2 class="display-heading mt-2">
            <span class="accent">${state.totalRounds}</span> Track${state.totalRounds !== 1 ? 's' : ''}
          </h2>
          <p class="text-muted mt-4" style="font-size:0.9375rem;line-height:1.6">
            How many can you name? The clock starts as soon as the music plays.
          </p>
        </div>

        <button id="ready-btn" class="btn btn--primary btn--full" disabled>
          <span class="material-symbols-outlined">play_arrow</span>
          Getting ready…
        </button>
      </div>
    </div>
  `

  // Pre-warm the SDK while the user reads the screen — enables audio on click
  const { sdkReady } = await initPlayer(null)
  const btn = document.getElementById('ready-btn')
  if (!btn) return

  if (sdkReady) {
    btn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span> Start Game`
    btn.disabled = false
  } else {
    btn.innerHTML = `<span class="material-symbols-outlined">warning</span> No Spotify player found`
    btn.disabled = true
  }

  // This click IS the user gesture — browser unlocks AudioContext here
  btn.addEventListener('click', () => navigate('/play'))
}
