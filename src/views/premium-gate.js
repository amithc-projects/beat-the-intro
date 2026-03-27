import { navigate } from '../router.js'
import { logout } from '../auth/spotify-auth.js'

const app = document.getElementById('app')

export function renderPremiumGate() {
  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-6">
        <h1 class="display-heading">Premium<br><span class="accent">Required</span></h1>
        <div class="card" style="border-left:4px solid var(--ds-sys-color-error)">
          <p class="section-label text-error">Spotify Premium required</p>
          <p class="mt-2" style="font-size:0.9375rem;line-height:1.5">
            Beat the Intro uses the Spotify Web Playback SDK, which requires a Premium subscription to stream tracks in-browser.
          </p>
        </div>
        <button id="retry-btn" class="btn btn--secondary btn--full">
          Try a different account
        </button>
      </div>
    </div>
  `

  document.getElementById('retry-btn').addEventListener('click', () => {
    logout()
    navigate('/login')
  })
}
