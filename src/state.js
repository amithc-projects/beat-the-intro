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
  startTime: null,    // Per-round start timestamp (ms)
  totalElapsedMs: 0,

  // Share
  sharePayload: null, // { playlistId, trackIds, score, totalSeconds }
}
