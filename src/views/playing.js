import { navigate, getQueryParams } from '../router.js'
import { state } from '../state.js'
import { startRound, currentTrack, startGame } from '../game/game-engine.js'
import { initPlayer, playTrack, resumePlayback, pausePlayback } from '../player/playback.js'
import { getTracks } from '../api/spotify-api.js'
import { showToast } from '../components/toast.js'
import { track } from '../events.js'

const app = document.getElementById('app')
let timerInterval = null

function waveformBars(count = 16) {
  return Array(count).fill(0).map(() => `<span class="waveform__bar"></span>`).join('')
}

export async function renderPlaying() {
  // ── Share link bootstrap ────────────────────────────────────────────────────
  if (!state.tracks.length) {
    const params = getQueryParams()
    if (params.tracks && params.playlist) {
      await setupFromShareLink(params.playlist, params.tracks.split(','))
      return // setupFromShareLink navigates to /ready or /playlists
    } else {
      navigate('/playlists')
      return
    }
  }

  // ── Resume vs new round ─────────────────────────────────────────────────────
  const isResuming = state.pausedElapsedMs !== null
  const resumeFrom = state.pausedElapsedMs || 0

  if (!isResuming) {
    startRound()
  }
  state.pausedElapsedMs = null

  const t = currentTrack()
  const coverUrl = t.album.images?.[0]?.url || ''

  app.innerHTML = `
    <div class="view view--centered">
      <div class="pg-play view__inner">
        <div class="pg-hdr">
          <div class="pg-hdr__top">
            <h2 class="display-heading">LISTEN</h2>
            <span class="badge badge--round">Round ${state.currentRound} of ${state.totalRounds}</span>
          </div>
          <div class="pg-hdr__timer">
            <span class="timer" id="timer">00<span class="timer__dot">.</span>00</span>
          </div>
        </div>

        <div class="pg-cnt">
          <div class="album-art">
            <img class="album-art__img" src="${coverUrl}" alt="Album art">
            <div class="album-art__lock">
              <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">question_mark</span>
            </div>
          </div>

          <div class="play-wav">
            <span class="section-label" id="sdk-status"></span>
            <div class="waveform" id="waveform">
              ${waveformBars()}
            </div>
            <div class="progress-bar" style="width:100%">
              <div class="progress-bar__fill" id="progress-fill" style="width:0%"></div>
            </div>
          </div>
        </div>

        <div class="pg-btn">
          <button id="pause-btn" class="btn btn--primary btn--full" disabled>
            <span class="material-symbols-outlined">pause</span>
            Pause &amp; Guess
          </button>
        </div>
      </div>
    </div>
  `

  if (!isResuming) track('round_started', { round: state.currentRound, trackId: t.id })

  const waveformEl   = document.getElementById('waveform')
  const pauseBtn     = document.getElementById('pause-btn')
  const sdkStatus    = document.getElementById('sdk-status')

  try {
    const { sdkReady } = await initPlayer(null)

    if (!sdkReady) {
      sdkStatus.textContent = 'SDK unavailable — open Spotify on a device'
      showToast('Open Spotify app to enable playback', 'error')
      pauseBtn.disabled = false
      return
    }

    if (isResuming) {
      // Backdate startTime so elapsed accumulates correctly
      state.startTime = Date.now() - resumeFrom
      await resumePlayback()
    } else {
      await playTrack(t.uri)
    }

    waveformEl.classList.add('is-playing')
    pauseBtn.disabled = false
    startTimer(t.duration_ms, resumeFrom)
  } catch (err) {
    console.error(err)
    showToast('Playback error — is Spotify Premium active?', 'error')
    pauseBtn.disabled = false
  }

  pauseBtn.addEventListener('click', async () => {
    clearInterval(timerInterval)
    // Capture exact elapsed at the moment of click
    state.pausedElapsedMs = Date.now() - state.startTime

    // Update display to the exact paused value so the user sees the same
    // number here and on the guess screen (avoids the ~50ms tick lag)
    const timerEl = document.getElementById('timer')
    if (timerEl) {
      const secs  = Math.floor(state.pausedElapsedMs / 1000)
      const cents = Math.floor((state.pausedElapsedMs % 1000) / 10)
      timerEl.innerHTML = `${pad(secs)}<span class="timer__dot">.</span>${pad(cents)}`
    }

    try { await pausePlayback() } catch { /* ignore */ }
    navigate('/guess')
  })
}

// ── Share link setup ──────────────────────────────────────────────────────────
async function setupFromShareLink(playlistId, trackIds) {
  try {
    const tracks = await getTracks(trackIds)
    startGame(
      { id: playlistId, name: 'Shared Game', images: [] },
      tracks,
      tracks.length,
      { presorted: true }
    )
    navigate('/ready') // User gesture on ready screen unlocks browser audio
  } catch (err) {
    console.error('Failed to load shared tracks', err)
    showToast('Could not load shared game', 'error')
    navigate('/playlists')
  }
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(durationMs, offsetMs = 0) {
  const wallStart = Date.now() - offsetMs
  const timerEl   = document.getElementById('timer')
  const fill      = document.getElementById('progress-fill')

  timerInterval = setInterval(() => {
    if (!timerEl) { clearInterval(timerInterval); return }
    const elapsed = Date.now() - wallStart
    const secs  = Math.floor(elapsed / 1000)
    const cents = Math.floor((elapsed % 1000) / 10)
    timerEl.innerHTML = `${pad(secs)}<span class="timer__dot">.</span>${pad(cents)}`
    if (durationMs > 0) {
      fill.style.width = `${Math.min(100, (elapsed / durationMs) * 100)}%`
    }
  }, 50)
}

function pad(n) { return String(n).padStart(2, '0') }
