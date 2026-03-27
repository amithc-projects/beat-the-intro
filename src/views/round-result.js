import { navigate } from '../router.js'
import { state } from '../state.js'
import { isLastRound, correctCount } from '../game/game-engine.js'
import { showToast } from '../components/toast.js'

const app = document.getElementById('app')

export function renderRoundResult() {
  if (!state.rounds.length) { navigate('/playlists'); return }

  const round = state.rounds[state.rounds.length - 1]
  const { track, guess, isCorrect, artistMatch, titleMatch, elapsedMs } = round
  const correctArtist = track.artists.map(a => a.name).join(', ')
  const coverUrl = track.album.images?.[0]?.url || ''
  const last = isLastRound()
  const score = correctCount()
  const secs = (elapsedMs / 1000).toFixed(1)

  app.innerHTML = `
    <div class="view">
      <div class="view__inner space-y-6">

        <!-- Big verdict banner -->
        <div class="result-verdict result-verdict--${isCorrect ? 'correct' : 'wrong'}">
          <span class="material-symbols-outlined result-verdict__icon" style="font-variation-settings:'FILL' 1">
            ${isCorrect ? 'check_circle' : 'cancel'}
          </span>
          <span class="result-verdict__word">${isCorrect ? 'Correct!' : 'Wrong!'}</span>
          <span class="result-verdict__time">${secs}s</span>
        </div>

        <!-- Track reveal -->
        <div style="display:flex;gap:1.25rem;align-items:flex-start">
          ${coverUrl
            ? `<img src="${coverUrl}" alt="Album art" style="width:88px;height:88px;object-fit:cover;flex-shrink:0;border:2px solid #fff">`
            : ''}
          <div style="min-width:0">
            <p style="font-weight:900;font-size:1.1rem;text-transform:uppercase;letter-spacing:-0.02em;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(track.name)}</p>
            <p class="text-volt font-bold tracking-wide uppercase text-sm mt-2">${escHtml(correctArtist)}</p>
            <p class="text-muted text-xs tracking-wide uppercase mt-2">${escHtml(track.album.name)}</p>
          </div>
        </div>

        <!-- Artist / Title breakdown -->
        <div class="result-breakdown">
          <div class="result-breakdown__row">
            <span class="result-breakdown__label">Artist</span>
            <span class="result-breakdown__status result-breakdown__status--${artistMatch ? 'correct' : 'wrong'}">
              <span class="material-symbols-outlined" style="font-size:1rem;font-variation-settings:'FILL' 1">${artistMatch ? 'check_circle' : 'cancel'}</span>
              ${escHtml(guess.artist || '—')}
            </span>
          </div>
          <div class="result-breakdown__row">
            <span class="result-breakdown__label">Title</span>
            <span class="result-breakdown__status result-breakdown__status--${titleMatch ? 'correct' : 'wrong'}">
              <span class="material-symbols-outlined" style="font-size:1rem;font-variation-settings:'FILL' 1">${titleMatch ? 'check_circle' : 'cancel'}</span>
              ${escHtml(guess.title || '—')}
            </span>
          </div>
        </div>

        <!-- Score + next -->
        <p class="section-label">${score} correct — Round ${state.currentRound} of ${state.totalRounds}</p>

        <button id="next-btn" class="btn btn--primary btn--full">
          ${last
            ? '<span class="material-symbols-outlined">bar_chart</span> See Summary'
            : '<span class="material-symbols-outlined">skip_next</span> Next Round'
          }
        </button>
      </div>
    </div>
  `

  showToast(isCorrect ? '✓ Correct!' : '✗ Wrong answer', isCorrect ? 'success' : 'error', 2500)

  document.getElementById('next-btn').addEventListener('click', () => {
    navigate(last ? '/summary' : '/play')
  })
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
