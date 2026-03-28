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
      <div class="pg-guess view__inner">

        <div class="pg-hdr">
          <div class="pg-hdr__top">
            <h2 class="display-heading">GUESS</h2>
            <span class="badge badge--round">Round ${state.currentRound} of ${state.totalRounds}</span>
          </div>
          <div class="pg-hdr__timer">
            <span class="timer" id="paused-timer">${formatTime(elapsed)}</span>
          </div>
        </div>

        <div class="pg-cnt">
          <div class="guess-inputs">
            <div class="field-group">
              <label class="section-label" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
                <span class="material-symbols-outlined" style="font-size:1.1rem">person_search</span>
                Artist Name
              </label>
              <input type="text" id="artist-input" class="input" placeholder="e.g. The Beatles" autocomplete="off" spellcheck="false">
            </div>
            <div class="field-group">
              <label class="section-label" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
                <span class="material-symbols-outlined" style="font-size:1.1rem">music_note</span>
                Song Title
              </label>
              <input type="text" id="title-input" class="input" placeholder="e.g. Come Together" autocomplete="off" spellcheck="false">
            </div>
          </div>
        </div>

        <div class="pg-btn">
          <button id="resume-btn" class="btn btn--outline">
            <span class="material-symbols-outlined">play_arrow</span>
            Resume Listening
          </button>
          <button id="submit-btn" class="btn btn--primary">
            <span class="material-symbols-outlined">check</span>
            Submit Guess
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
    // pausedElapsedMs intentionally kept — playing.js uses it to resume
    navigate('/play')
  })

  ;['artist-input', 'title-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('submit-btn').click()
    })
  })
}
