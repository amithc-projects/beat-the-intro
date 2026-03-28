import { navigate } from '../router.js'
import { state } from '../state.js'
import { correctCount, buildSharePayload } from '../game/game-engine.js'
import { track } from '../events.js'
import { playTrack } from '../player/playback.js'

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
    <div class="view view--centered">
      <div class="pg-sum view__inner">

        <div class="pg-hdr">
          <div class="pg-hdr__top">
            <h2 class="display-heading">GAME <span class="accent">OVER</span></h2>
            <span class="badge badge--round">${escHtml(state.playlist.name)}</span>
          </div>
        </div>

        <div class="sum-tiles">
          <!-- Score -->
          <div class="card--elevated card" style="text-align:center;display:flex;flex-direction:column;justify-content:center;width:100%">
            <p class="section-label">Score</p>
            <p style="font-size:2.8rem;font-weight:900;font-style:italic;letter-spacing:-0.04em;margin:0.25rem 0 0">
              ${score}<span class="text-volt">/${state.totalRounds}</span>
            </p>
          </div>

          <!-- Total Time -->
          <div class="card--elevated card" style="text-align:center;display:flex;flex-direction:column;justify-content:center;width:100%">
            <p class="section-label">Total time</p>
            <p style="font-size:2.8rem;font-weight:900;font-style:italic;letter-spacing:-0.04em;margin:0.25rem 0 0">
              ${mins > 0 ? `${mins}m ` : ''}${secs}<span class="text-volt">s</span>
            </p>
          </div>

          <!-- Round Tiles -->
          ${state.rounds.map((r, i) => {
            const img = r.track.album.images?.[0]?.url || ''
            const artist = escHtml(r.track.artists.map(a=>a.name).join(', '))
            return `
              <div class="round-tile-wrap" style="width:100%">
                <div class="round-tile" style="${img ? `background-image:url('${img}')` : 'background:#1f1f1f'}">
                  <div class="round-tile__overlay">
                    <p class="round-tile__track">${escHtml(r.track.name)}</p>
                    <p class="round-tile__artist">${artist}</p>
                    <p class="round-tile__time">${(r.elapsedMs/1000).toFixed(1)}s</p>
                    <button class="round-tile__replay btn btn--icon" data-uri="${r.track.uri}" title="Replay Song">
                      <span class="material-symbols-outlined">play_circle</span>
                    </button>
                  </div>
                </div>
                <div class="round-tile__label round-tile__label--${r.isCorrect ? 'correct' : 'wrong'}">
                  <span class="round-tile__label-num" style="font-size:1rem">${i + 1}</span>
                  <span class="round-tile__label-verdict" style="font-size:0.75rem">${r.isCorrect ? 'Correct' : 'Incorrect'}</span>
                </div>
              </div>
            `
          }).join('')}
        </div>

        <div class="sum-btn">
          <button id="share-btn" class="btn btn--secondary">
            <span class="material-symbols-outlined">share</span>
            Share Result
          </button>
          <button id="new-btn" class="btn btn--outline">
            <span class="material-symbols-outlined">first_page</span>
            Playlists
          </button>
          <button id="again-btn" class="btn btn--primary">
            <span class="material-symbols-outlined">replay</span>
            Again
          </button>
        </div>
      </div>
    </div>
  `

  const cleanup = async () => {
    try { 
      const { pausePlayback } = await import('../player/playback.js')
      await pausePlayback() 
    } catch (e) {}
  }

  document.getElementById('share-btn').addEventListener('click', async () => {
    await cleanup()
    navigate('/share')
  })
  document.getElementById('again-btn').addEventListener('click', async () => {
    await cleanup()
    navigate('/config')
  })
  document.getElementById('new-btn').addEventListener('click', async () => {
    await cleanup()
    navigate('/playlists')
  })

  // Replay Delegation
  app.addEventListener('click', (e) => {
    const replayBtn = e.target.closest('.round-tile__replay')
    if (replayBtn) {
      const uri = replayBtn.dataset.uri
      playTrack(uri).catch(err => {
        console.error('Replay failed', err)
      })
    }
  })
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
