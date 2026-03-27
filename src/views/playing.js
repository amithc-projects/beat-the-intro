import { navigate } from '../router.js'
import { state } from '../state.js'
import { startRound, currentTrack, isLastRound } from '../game/game-engine.js'
import { initPlayer, playTrack, isSdkReady } from '../player/playback.js'
import { showToast } from '../components/toast.js'
import { track } from '../events.js'

const app = document.getElementById('app')

let timerInterval = null

function waveformBars(count = 16) {
  return Array(count).fill(0).map(() => `<span class="waveform__bar"></span>`).join('')
}

export async function renderPlaying() {
  if (!state.tracks.length) { navigate('/playlists'); return }

  startRound()
  const t = currentTrack()
  const coverUrl = t.album.images?.[0]?.url || ''

  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-6" style="text-align:center">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="badge">Round ${state.currentRound} of ${state.totalRounds}</span>
          <span class="section-label" id="sdk-status"></span>
        </div>

        <div class="album-art" style="margin:0 auto">
          <img class="album-art__img" src="${coverUrl}" alt="Album art">
          <div class="album-art__lock">
            <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">lock</span>
          </div>
        </div>

        <div class="timer" id="timer">00<span class="timer__dot">.</span>00</div>

        <div class="waveform" id="waveform">
          ${waveformBars()}
        </div>

        <div class="progress-bar" style="width:100%">
          <div class="progress-bar__fill" id="progress-fill" style="width:0%"></div>
        </div>

        <button id="pause-btn" class="btn btn--primary btn--full" disabled>
          <span class="material-symbols-outlined">pause</span>
          Pause &amp; Guess
        </button>
      </div>
    </div>
  `

  track('round_started', { round: state.currentRound, trackId: t.id })

  const waveformEl  = document.getElementById('waveform')
  const pauseBtn    = document.getElementById('pause-btn')
  const sdkStatus   = document.getElementById('sdk-status')
  const progressFill = document.getElementById('progress-fill')

  // Init player and play
  try {
    const { sdkReady } = await initPlayer(null)

    if (!sdkReady) {
      sdkStatus.textContent = 'SDK unavailable — open Spotify on a device'
      showToast('Open Spotify app to enable playback', 'error')
      pauseBtn.disabled = false
      return
    }

    await playTrack(t.uri)
    waveformEl.classList.add('is-playing')
    pauseBtn.disabled = false
    startTimer(t.duration_ms)
  } catch (err) {
    console.error(err)
    showToast('Playback error — is Spotify Premium active?', 'error')
    pauseBtn.disabled = false
  }

  pauseBtn.addEventListener('click', () => {
    clearInterval(timerInterval)
    navigate('/guess')
  })
}

function startTimer(durationMs) {
  const startMs = Date.now()
  const timerEl = document.getElementById('timer')
  const fill    = document.getElementById('progress-fill')
  const waveformEl = document.getElementById('waveform')

  timerInterval = setInterval(() => {
    if (!timerEl) { clearInterval(timerInterval); return }
    const elapsed = Date.now() - startMs
    const secs  = Math.floor(elapsed / 1000)
    const cents = Math.floor((elapsed % 1000) / 10)
    timerEl.innerHTML = `${pad(secs)}<span class="timer__dot">.</span>${pad(cents)}`

    if (durationMs > 0) {
      fill.style.width = `${Math.min(100, (elapsed / durationMs) * 100)}%`
    }
  }, 50)
}

function pad(n) {
  return String(n).padStart(2, '0')
}
