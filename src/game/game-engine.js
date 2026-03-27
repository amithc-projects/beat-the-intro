import Fuse from 'fuse.js'
import { state } from '../state.js'

// ── Track title normalisation ─────────────────────────────────────────────────
const STRIP_PATTERNS = [
  /\s*[\(\[](feat\.?|ft\.?|featuring)[^\)\]]*[\)\]]/gi,
  /\s*-\s*(remaster(ed)?|radio edit|single (version|edit)|live|acoustic|demo|remix)[^,]*/gi,
  /\s*[\(\[].*?[\)\]]/gi, // any remaining parens/brackets
]

export function normaliseTitle(str) {
  let s = str.toLowerCase().trim()
  STRIP_PATTERNS.forEach(p => { s = s.replace(p, '') })
  return s.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

// ── Fuzzy matching ────────────────────────────────────────────────────────────
function fuzzyMatch(guess, target) {
  if (!guess || !guess.trim()) return false
  const fuse = new Fuse([normaliseTitle(target)], { threshold: 0.35 })
  return fuse.search(normaliseTitle(guess)).length > 0
}

export function evaluateGuess(artistGuess, titleGuess, track) {
  const correctArtist = track.artists.map(a => a.name).join(' ')
  const artistMatch = fuzzyMatch(artistGuess, correctArtist)
  const titleMatch  = fuzzyMatch(titleGuess, track.name)
  return {
    isCorrect: artistMatch && titleMatch,
    artistMatch,
    titleMatch,
  }
}

// ── Shuffle ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Game lifecycle ────────────────────────────────────────────────────────────
export function startGame(playlist, allTracks, requestedRounds, { presorted = false } = {}) {
  const tracks = presorted ? allTracks : shuffle(allTracks)
  const totalRounds = Math.min(requestedRounds, tracks.length)

  state.playlist        = playlist
  state.tracks          = tracks.slice(0, totalRounds)
  state.totalRounds     = totalRounds
  state.currentRound    = 0
  state.rounds          = []
  state.totalElapsedMs  = 0
  state.pausedElapsedMs = null
  state.sharePayload    = null
}

export function startRound() {
  state.currentRound += 1
  state.startTime = Date.now()
}

export function currentTrack() {
  return state.tracks[state.currentRound - 1]
}

export function submitGuess(artistGuess, titleGuess) {
  const track = currentTrack()
  const elapsed = state.pausedElapsedMs !== null ? state.pausedElapsedMs : (Date.now() - state.startTime)
  state.pausedElapsedMs = null // Reset so next round is recognized as new round
  const result = evaluateGuess(artistGuess, titleGuess, track)

  state.rounds.push({
    track,
    guess: { artist: artistGuess, title: titleGuess },
    isCorrect: result.isCorrect,
    artistMatch: result.artistMatch,
    titleMatch: result.titleMatch,
    elapsedMs: elapsed,
  })

  state.totalElapsedMs += elapsed
  return state.rounds[state.rounds.length - 1]
}

export function isLastRound() {
  return state.currentRound >= state.totalRounds
}

export function correctCount() {
  return state.rounds.filter(r => r.isCorrect).length
}

export function buildSharePayload() {
  state.sharePayload = {
    playlistId: state.playlist.id,
    trackIds: state.tracks.map(t => t.id),
    score: correctCount(),
    totalSeconds: Math.round(state.totalElapsedMs / 1000),
  }
  return state.sharePayload
}
