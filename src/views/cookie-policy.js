import { navigate } from '../router.js'

const app = document.getElementById('app')

export function renderCookiePolicy() {
  app.innerHTML = `
    <div class="view">
      <div class="view__inner space-y-6">
        <nav style="display:flex;gap:0.5rem;align-items:center" aria-label="Breadcrumb">
          <a href="#/playlists" class="text-muted text-xs tracking-wide uppercase">Home</a>
          <span class="text-muted text-xs">›</span>
          <span class="text-xs tracking-wide uppercase">Cookie Policy</span>
        </nav>
        <h2 class="display-heading">Cookie <span class="accent">Policy</span></h2>
        <div class="space-y-4" style="line-height:1.65;color:var(--ds-sys-color-on-surface-variant)">
          <p>Beat the Intro uses <strong style="color:#e2e2e2">localStorage</strong> to store your Spotify OAuth tokens and game preferences on your device. No third-party cookies or tracking pixels are used.</p>
          <p><strong style="color:#e2e2e2">What we store locally:</strong></p>
          <ul style="padding-left:1.25rem;margin:0">
            <li>Spotify access and refresh tokens (cleared on logout)</li>
            <li>Theme preference</li>
          </ul>
          <p>We do not use cookies in the traditional browser sense. No data is sent to any server other than the Spotify API for authentication and playback.</p>
        </div>
        <button class="btn btn--ghost" onclick="window.history.back()">Back</button>
      </div>
    </div>
  `
}
