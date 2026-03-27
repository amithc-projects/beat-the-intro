import { navigate } from '../router.js'
import { state } from '../state.js'
import { currentTrack, submitGuess } from '../game/game-engine.js'
import { track } from '../events.js'

const app = document.getElementById('app')

function formatTime(ms) {
  const secs  = Math.floor(ms / 1000)
  const cents = Math.floor((ms % 1000) / 10)
  return `${String(secs).padStart(2,'0')}<span style="color:#D1FF00">.</span>${String(cents).padStart(2,'0')}`
}

export function renderGuessing() {
  if (!state.tracks.length) { navigate('/playlists'); return }

  const elapsed = state.pausedElapsedMs ?? 0

  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-6">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="badge">Round ${state.currentRound} of ${state.totalRounds}</span>
          <span class="timer" style="font-size:2.5rem" id="paused-timer">${formatTime(elapsed)}</span>
        </div>

        <h2 class="display-heading">Name the <span class="accent">Track</span></h2>

        <div class="space-y-4">
          <div class="field">
            <label class="field__label" for="artist-input">Artist name</label>
            <input id="artist-input" class="field__input" type="text" placeholder="e.g. The Beatles" autocomplete="off" autocorrect="off" spellcheck="false">
          </div>
          <div class="field">
            <label class="field__label" for="title-input">Song title</label>
            <input id="title-input" class="field__input" type="text" placeholder="e.g. Come Together" autocomplete="off" autocorrect="off" spellcheck="false">
          </div>
        </div>

        <div class="space-y-4">
          <button id="submit-btn" class="btn btn--primary btn--full">
            <span class="material-symbols-outlined">check</span>
            Submit Guess
          </button>
          <button id="resume-btn" class="btn btn--ghost btn--full">
            <span class="material-symbols-outlined">play_arrow</span>
            Resume Listening
          </button>
        </div>
      </div>
    </div>
  `

  // Auto-focus artist field
  setTimeout(() => document.getElementById('artist-input')?.focus(), 50)

  document.getElementById('submit-btn').addEventListener('click', () => {
    const artistGuess = document.getElementById('artist-input').value.trim()
    const titleGuess  = document.getElementById('title-input').value.trim()
    const result = submitGuess(artistGuess, titleGuess)

    track('guess_submitted', { round: state.currentRound, isCorrect: result.isCorrect })
    if (result.isCorrect) track('guess_correct')
    else track('guess_incorrect')

    navigate('/result')
  })

  document.getElementById('resume-btn').addEventListener('click', () => {
    // pausedElapsedMs is still set — playing.js will use it to resume
    navigate('/play')
  })

  ;['artist-input', 'title-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('submit-btn').click()
    })
  })
}
