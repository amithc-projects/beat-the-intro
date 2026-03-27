import { navigate } from '../router.js'
import { state } from '../state.js'
import { isLastRound, correctCount } from '../game/game-engine.js'
import { showToast } from '../components/toast.js'

const app = document.getElementById('app')

export function renderRoundResult() {
  if (!state.rounds.length) { navigate('/playlists'); return }

  const round = state.rounds[state.rounds.length - 1]
  const { track, guess, isCorrect, artistMatch, titleMatch } = round
  const correctArtist = track.artists.map(a => a.name).join(', ')
  const coverUrl = track.album.images?.[0]?.url || ''
  const last = isLastRound()
  const score = correctCount()

  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-6">
        <div style="display:flex;align-items:center;gap:1rem">
          <span class="badge badge--${isCorrect ? 'success' : 'error'}">
            ${isCorrect ? 'Correct' : 'Incorrect'}
          </span>
          <span class="section-label">Round ${state.currentRound} of ${state.totalRounds}</span>
        </div>

        <div style="display:flex;gap:1.25rem;align-items:flex-start">
          ${coverUrl ? `<img src="${coverUrl}" alt="Album art" style="width:96px;height:96px;object-fit:cover;flex-shrink:0;border:2px solid #fff">` : ''}
          <div>
            <p style="font-weight:900;font-size:1.25rem;text-transform:uppercase;letter-spacing:-0.02em;margin:0">${escHtml(track.name)}</p>
            <p class="text-volt font-bold tracking-wide uppercase text-sm mt-2">${escHtml(correctArtist)}</p>
            <p class="text-muted text-xs tracking-wide uppercase mt-2">${escHtml(track.album.name)}</p>
          </div>
        </div>

        ${!isCorrect ? `
          <div class="card" style="border-left:4px solid var(--ds-sys-color-outline-variant)">
            <p class="section-label">Your guess</p>
            <p class="mt-2 text-sm">
              <span class="${artistMatch ? 'text-volt' : 'text-error'}">${escHtml(guess.artist || '—')}</span>
              &nbsp;·&nbsp;
              <span class="${titleMatch ? 'text-volt' : 'text-error'}">${escHtml(guess.title || '—')}</span>
            </p>
          </div>
        ` : ''}

        <p class="section-label">${score} correct so far</p>

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
