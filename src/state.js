// Central app state — single source of truth
export const state = {
  // Auth
  user: null,         // Spotify user object { id, display_name, images, product }

  // Game session
  playlist: null,     // Selected playlist object
  totalRounds: 5,
  currentRound: 0,
  tracks: [],         // Pre-shuffled playable tracks
  rounds: [],         // [{ track, guess, isCorrect, elapsedMs }]
  startTime: null,      // Per-round start timestamp (ms)
  pausedElapsedMs: null, // ms elapsed when user paused — null means not paused
  totalElapsedMs: 0,

  // Share
  sharePayload: null, // { playlistId, trackIds, score, totalSeconds }

  // Devices (Spotify Connect)
  // UI / Layout
  isForcedLandscape: localStorage.getItem('bti_force_landscape') === 'true', 
}
