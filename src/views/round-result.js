import { navigate } from '../router.js'
import { state } from '../state.js'
import { isLastRound, correctCount } from '../game/game-engine.js'
import { showToast } from '../components/toast.js'

const app = document.getElementById('app')

export function renderRoundResult() {
  if (!state.rounds.length) { navigate('/playlists'); return }

  const round = state.rounds[state.rounds.length - 1]
  const { track, guess, isCorrect, artistMatch, titleMatch, elapsedMs } = round
  const isPartial = !isCorrect && (artistMatch || titleMatch)
  const correctArtist = track.artists.map(a => a.name).join(', ')
  const coverUrl = track.album.images?.[0]?.url || ''
  const last = isLastRound()
  const score = correctCount()
  const secs = (elapsedMs / 1000).toFixed(1)

  const verdictClass = isCorrect ? 'correct' : isPartial ? 'partial' : 'wrong'
  const verdictIcon  = isCorrect ? 'check_circle' : isPartial ? 'warning' : 'cancel'
  const verdictWord  = isCorrect ? 'Correct!' : isPartial ? 'Close!' : 'Wrong!'

  app.innerHTML = `
    <div class="view view--centered">
      <div class="lscape-result view__inner view__inner--wide">

        <!-- HEADER ROW -->
        <div class="lscape-row-header">
          <div class="lscape-row-header__top">
            <h2 class="display-heading">REVEAL</h2>
            <span class="badge badge--round">Round ${state.currentRound} of ${state.totalRounds}</span>
          </div>
          <div class="lscape-row-header__timer">
            <span class="timer">${secs}s</span>
          </div>
        </div>

        <div class="lscape-main-content">
          <!-- Banner -->
          <div class="result-verdict result-verdict--${verdictClass}">
            <span class="material-symbols-outlined result-verdict__icon" style="font-variation-settings:'FILL' 1">
              ${verdictIcon}
            </span>
            <span class="result-verdict__word">${verdictWord}</span>
          </div>

          <!-- Breakdown -->
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

          <p class="section-label">${score} correct</p>

          <!-- Reveal -->
          <div id="track-reveal" ${!isCorrect ? 'style="display:none"' : ''}>
            <div style="display:flex;gap:1.25rem;align-items:flex-start;width:100%;max-width:400px">
              ${coverUrl
                ? `<img src="${coverUrl}" alt="Album art" style="width:88px;height:88px;object-fit:cover;flex-shrink:0;border:2px solid #fff">`
                : ''}
              <div style="min-width:0">
                <p style="font-weight:900;font-size:1.1rem;text-transform:uppercase;letter-spacing:-0.02em;margin:0;word-break:break-word">${escHtml(track.name)}</p>
                <p class="text-volt font-bold tracking-wide uppercase text-sm mt-2">${escHtml(correctArtist)}</p>
                <p class="text-muted text-xs tracking-wide uppercase mt-2">${escHtml(track.album.name)}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM CTAs (3rd Grid Row) -->
        <div class="lscape-row-buttons">
          ${(!isCorrect && !last) ? `
            <button id="hear-more-btn" class="btn btn--outline">
              <span class="material-symbols-outlined">hearing</span>
              Hear More
            </button>
          ` : ''}
          <div id="result-ctas-right" style="display:flex; gap:0.75rem; margin-left: auto">
            ${isCorrect ? `
              <button id="next-btn" class="btn btn--primary">
                ${last
                  ? '<span class="material-symbols-outlined">bar_chart</span> Summary'
                  : '<span class="material-symbols-outlined">skip_next</span> Next'
                }
              </button>
            ` : `
              <button id="reveal-btn" class="btn btn--primary">
                <span class="material-symbols-outlined">visibility</span>
                Reveal Answer
              </button>
              <button id="next-btn" class="btn btn--primary" style="display:none">
                ${last
                  ? '<span class="material-symbols-outlined">bar_chart</span> Summary'
                  : '<span class="material-symbols-outlined">skip_next</span> Next'
                }
              </button>
            `}
          </div>
        </div>

      </div>
    </div>
  `


  // Reveal answer (wrong path only)
  document.getElementById('reveal-btn')?.addEventListener('click', () => {
    document.getElementById('track-reveal').style.display = 'block'
    document.getElementById('reveal-btn').style.display = 'none'
    document.getElementById('next-btn').style.display = 'flex'
    const hm = document.getElementById('hear-more-wrap')
    if (hm) hm.style.display = 'none'
  })

  document.getElementById('next-btn')?.addEventListener('click', () => {
    navigate(last ? '/summary' : '/play')
  })

  document.getElementById('hear-more-btn')?.addEventListener('click', () => {
    const undone = state.rounds.pop()
    state.totalElapsedMs -= undone.elapsedMs
    state.pausedElapsedMs = undone.elapsedMs
    navigate('/play')
  })
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
