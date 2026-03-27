import { redirectToSpotify } from '../auth/spotify-auth.js'
import { track } from '../events.js'

const app = document.getElementById('app')

export function renderLogin() {
  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-8" style="text-align:center">
        <div>
          <h1 class="display-heading">Beat the<br><span class="accent">Intro</span></h1>
          <p class="section-label mt-2">How fast can you name the track?</p>
        </div>
        <button id="login-btn" class="btn btn--primary btn--full">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">graphic_eq</span>
          Connect with Spotify
        </button>
        <div style="display:flex;gap:1.5rem;justify-content:center">
          <a href="#/cookies" class="text-muted text-xs tracking-wide uppercase">Cookie Policy</a>
          <a href="#/privacy" class="text-muted text-xs tracking-wide uppercase">Privacy Policy</a>
        </div>
      </div>
    </div>
  `

  document.getElementById('login-btn').addEventListener('click', () => {
    track('login_initiated')
    redirectToSpotify()
  })
}
