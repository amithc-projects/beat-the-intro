const app = document.getElementById('app')

export function renderPrivacyPolicy() {
  app.innerHTML = `
    <div class="view">
      <div class="view__inner space-y-6">
        <nav style="display:flex;gap:0.5rem;align-items:center" aria-label="Breadcrumb">
          <a href="#/playlists" class="text-muted text-xs tracking-wide uppercase">Home</a>
          <span class="text-muted text-xs">›</span>
          <span class="text-xs tracking-wide uppercase">Privacy Policy</span>
        </nav>
        <h2 class="display-heading">Privacy <span class="accent">Policy</span></h2>
        <div class="space-y-4" style="line-height:1.65;color:var(--ds-sys-color-on-surface-variant)">
          <p>Beat the Intro is a client-side application. Your data stays on your device and is never sent to any server we operate.</p>
          <p><strong style="color:#e2e2e2">Data we access via Spotify:</strong></p>
          <ul style="padding-left:1.25rem;margin:0">
            <li>Your Spotify display name and profile image (shown in the navigation bar)</li>
            <li>Your Spotify playlists (so you can choose which to play)</li>
            <li>Playback control (to play/pause tracks through your Spotify account)</li>
          </ul>
          <p>We do not store, log, or transmit any of this data beyond your browser session. Logging out clears all stored tokens.</p>
          <p>This app is subject to the <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener" style="color:#D1FF00">Spotify Privacy Policy</a> for data processed by Spotify.</p>
        </div>
        <button class="btn btn--ghost" onclick="window.history.back()">Back</button>
      </div>
    </div>
  `
}
