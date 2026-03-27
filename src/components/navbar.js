import { navigate } from '../router.js'
import { state } from '../state.js'
import { logout } from '../auth/spotify-auth.js'
import { track } from '../events.js'

const navEl = document.getElementById('nav')

export function renderNav(user) {
  const avatarUrl = user.images?.[0]?.url || ''
  navEl.innerHTML = `
    <nav class="nav-bar" aria-label="Main navigation">
      <a href="#/playlists" class="nav-bar__brand">Beat the Intro</a>
      <div class="nav-bar__user">
        ${avatarUrl
          ? `<img src="${avatarUrl}" alt="${user.display_name}" class="nav-bar__avatar">`
          : `<div class="nav-bar__avatar" style="display:flex;align-items:center;justify-content:center;">
               <span class="material-symbols-outlined" style="font-size:1.25rem">person</span>
             </div>`
        }
        <span class="nav-bar__username">${user.display_name}</span>
      </div>
      <div class="nav-bar__actions">
        <button class="btn btn--icon" data-nav="settings" title="Settings" aria-label="Settings">
          <span class="material-symbols-outlined">settings</span>
        </button>
        <button class="btn btn--icon" data-nav="cookies" title="Cookie Policy" aria-label="Cookie Policy">
          <span class="material-symbols-outlined">cookie</span>
        </button>
        <button class="btn btn--icon" data-nav="privacy" title="Privacy Policy" aria-label="Privacy Policy">
          <span class="material-symbols-outlined">shield</span>
        </button>
        <button class="btn btn--icon" data-nav="logout" title="Logout" aria-label="Logout">
          <span class="material-symbols-outlined">logout</span>
        </button>
      </div>
    </nav>
  `

  navEl.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav
      if (target === 'logout') {
        track('logout')
        logout()
        navigate('/login')
      } else {
        navigate(`/${target}`)
      }
    })
  })
}

export function clearNav() {
  navEl.innerHTML = ''
}
