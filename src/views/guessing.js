import { navigate } from '../router.js'
import { state } from '../state.js'
import { currentTrack, submitGuess, isLastRound } from '../game/game-engine.js'
import { resumePlayback } from '../player/playback.js'
import { track } from '../events.js'

const app = document.getElementById('app')

export function renderGuessing() {
  if (!state.tracks.length) { navigate('/playlists'); return }

  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-6">
        <div>
          <span class="badge">Round ${state.currentRound} of ${state.totalRounds}</span>
          <h2 class="display-heading mt-4">Name the <span class="accent">Track</span></h2>
        </div>

        <div class="space-y-4">
          <div class="field">
            <label class="field__label" for="artist-input">Artist name</label>
            <input id="artist-input" class="field__input" type="text" placeholder="e.g. The Beatles" autocomplete="off" autocorrect="off">
          </div>
          <div class="field">
            <label class="field__label" for="title-input">Song title</label>
            <input id="title-input" class="field__input" type="text" placeholder="e.g. Come Together" autocomplete="off" autocorrect="off">
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

  document.getElementById('submit-btn').addEventListener('click', () => {
    const artistGuess = document.getElementById('artist-input').value.trim()
    const titleGuess  = document.getElementById('title-input').value.trim()
    const result = submitGuess(artistGuess, titleGuess)

    track('guess_submitted', {
      round: state.currentRound,
      isCorrect: result.isCorrect,
    })
    if (result.isCorrect) track('guess_correct')
    else track('guess_incorrect')

    navigate('/result')
  })

  document.getElementById('resume-btn').addEventListener('click', async () => {
    await resumePlayback()
    navigate('/play')
  })

  // Allow Enter to submit
  ;['artist-input','title-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('submit-btn').click()
    })
  })
}
