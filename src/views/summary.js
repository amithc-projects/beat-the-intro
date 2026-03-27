import { navigate } from '../router.js'
import { state } from '../state.js'
import { correctCount, buildSharePayload } from '../game/game-engine.js'
import { track } from '../events.js'

const app = document.getElementById('app')

export function renderSummary() {
  if (!state.rounds.length) { navigate('/playlists'); return }

  buildSharePayload()
  track('game_completed', {
    score: state.sharePayload.score,
    totalRounds: state.totalRounds,
    totalSeconds: state.sharePayload.totalSeconds,
  })

  const score   = correctCount()
  const totalSecs = state.sharePayload.totalSeconds
  const mins = Math.floor(totalSecs / 60)
  const secs  = totalSecs % 60

  app.innerHTML = `
    <div class="view">
      <div class="view__inner view__inner--wide lscape-summary">
        
        <!-- LEFT: Header and Score cards -->
        <div class="summary-left space-y-8">
          <div>
            <h2 class="display-heading">Game <span class="accent">Over</span></h2>
            <p class="section-label mt-2">${state.playlist.name}</p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="card--elevated card" style="text-align:center">
              <p class="section-label">Score</p>
              <p style="font-size:3rem;font-weight:900;font-style:italic;letter-spacing:-0.04em;margin:0.25rem 0 0">
                ${score}<span class="text-volt">/${state.totalRounds}</span>
              </p>
            </div>
            <div class="card--elevated card" style="text-align:center">
              <p class="section-label">Total time</p>
              <p style="font-size:3rem;font-weight:900;font-style:italic;letter-spacing:-0.04em;margin:0.25rem 0 0">
                ${mins > 0 ? `${mins}m ` : ''}${secs}<span class="text-volt">s</span>
              </p>
            </div>
          </div>
        </div>

        <!-- RIGHT: Round-by-round list and CTAs -->
        <div class="summary-right space-y-4">
          <div>
            <p class="section-label" style="margin-bottom:0.75rem">Round by round</p>
            <div class="round-tiles">
              ${state.rounds.map((r, i) => {
                const img = r.track.album.images?.[0]?.url || ''
                const artist = escHtml(r.track.artists.map(a=>a.name).join(', '))
                return `
                  <div class="round-tile-wrap">
                    <div class="round-tile" style="${img ? `background-image:url('${img}')` : 'background:#1f1f1f'}">
                      <div class="round-tile__overlay">
                        <p class="round-tile__track">${escHtml(r.track.name)}</p>
                        <p class="round-tile__artist">${artist}</p>
                        <p class="round-tile__time">${(r.elapsedMs/1000).toFixed(1)}s</p>
                      </div>
                    </div>
                    <div class="round-tile__label round-tile__label--${r.isCorrect ? 'correct' : 'wrong'}">
                      <span class="round-tile__label-num">${i + 1}</span>
                      <span class="round-tile__label-verdict">${r.isCorrect ? 'Correct' : 'Incorrect'}</span>
                    </div>
                  </div>
                `
              }).join('')}
            </div>
          </div>

          <div class="space-y-4">
            <button id="share-btn" class="btn btn--primary btn--full">
              <span class="material-symbols-outlined">share</span>
              Share Result
            </button>
            <button id="again-btn" class="btn btn--secondary btn--full">
              <span class="material-symbols-outlined">replay</span>
              Play Again
            </button>
            <button id="new-btn" class="btn btn--ghost btn--full">Choose New Playlist</button>
          </div>
        </div>

      </div>
    </div>
  `

  document.getElementById('share-btn').addEventListener('click', () => navigate('/share'))
  document.getElementById('again-btn').addEventListener('click', () => navigate('/config'))
  document.getElementById('new-btn').addEventListener('click', () => navigate('/playlists'))
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
