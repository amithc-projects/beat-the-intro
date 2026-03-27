const app = document.getElementById('app')

export function renderHowToPlay() {
  app.innerHTML = `
    <div class="view">
      <div class="view__inner space-y-8">
        <div>
          <h2 class="display-heading">How to <span class="accent">Play</span></h2>
        </div>

        <div class="card space-y-4" style="border-left: 4px solid #D1FF00">
          <p class="section-label text-volt">Spotify Premium required</p>
          <p style="line-height:1.65">Beat the Intro streams music directly through your browser using the Spotify Web Playback SDK. This feature is only available to <strong style="color:#e2e2e2">Spotify Premium</strong> subscribers — a paid subscription is required to play.</p>
        </div>

        <div class="space-y-6">
          ${[
            ['graphic_eq', 'Connect your Spotify account', 'Sign in with your Spotify Premium account. Your playlists are loaded automatically — no setup needed.'],
            ['queue_music', 'Pick a playlist', 'Choose any of your Spotify playlists. The more tracks it has, the more variety you\'ll get.'],
            ['settings', 'Set the number of rounds', 'Choose 3, 5, 10 or a custom number of rounds. You\'ll play at most as many rounds as there are tracks in the playlist.'],
            ['hearing', 'Listen and guess', 'Each round plays a random track from the beginning. Identify the artist and song title as fast as you can, then hit Pause & Guess.'],
            ['timer', 'Speed matters', 'Your time per round is recorded. The faster you guess correctly, the better your overall result.'],
            ['visibility_off', 'Wrong? You choose', 'If you get it wrong the answer is hidden. You can Reveal it straight away, or go back and Hear More before deciding.'],
            ['share', 'Challenge friends', 'After the game, copy your share link. Friends who follow it will play the exact same tracks in the same order — same challenge, head to head.'],
          ].map(([icon, title, body]) => `
            <div style="display:flex;gap:1rem;align-items:flex-start">
              <span class="material-symbols-outlined text-volt" style="font-size:1.5rem;flex-shrink:0;margin-top:0.125rem">${icon}</span>
              <div>
                <p style="font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;margin:0">${title}</p>
                <p class="text-muted text-sm mt-2" style="line-height:1.6">${body}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn--ghost" onclick="window.history.back()">Back</button>
      </div>
    </div>
  `
}
