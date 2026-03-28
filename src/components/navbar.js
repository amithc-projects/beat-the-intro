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

        <div class="nav-bar__right">
          <button id="tv-toggle-btn" class="btn btn--icon" aria-label="Toggle TV Mode" 
                  title="${state.isForcedLandscape ? 'Exit TV Mode' : 'Enter TV Mode'}"
                  style="color: ${state.isForcedLandscape ? '#fff' : '#888'}; margin-right: 0.5rem;">
            <span class="material-symbols-outlined">monitor</span>
          </button>

          <div class="nav-bar__user">
          ${avatarUrl
            ? `<img src="${avatarUrl}" alt="${user.display_name}" class="nav-bar__avatar">`
            : `<div class="nav-bar__avatar" style="display:flex;align-items:center;justify-content:center">
                 <span class="material-symbols-outlined" style="font-size:1.25rem">person</span>
               </div>`
          }
          <span class="nav-bar__username">${user.display_name}</span>
        </div>

        <button id="burger-btn" class="btn btn--icon" aria-label="Menu" aria-expanded="false">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>

    <!-- Drawer overlay -->
    <div id="drawer-overlay" class="drawer-overlay" aria-hidden="true"></div>

    <!-- Drawer -->
    <aside id="nav-drawer" class="nav-drawer" aria-label="Navigation menu" hidden>
      <div class="nav-drawer__header">
        <span class="nav-bar__brand" style="pointer-events:none">Menu</span>
        <button id="drawer-close" class="btn btn--icon" aria-label="Close menu">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <nav class="nav-drawer__links">
        <button class="nav-drawer__item" data-nav="how-to-play">
          <span class="material-symbols-outlined">help</span>
          How to Play
        </button>
        <button class="nav-drawer__item" data-nav="settings">
          <span class="material-symbols-outlined">settings</span>
          Settings
        </button>
        <button class="nav-drawer__item" data-nav="cookies">
          <span class="material-symbols-outlined">cookie</span>
          Cookie Policy
        </button>
        <button class="nav-drawer__item" data-nav="privacy">
          <span class="material-symbols-outlined">shield</span>
          Privacy Policy
        </button>
        <div class="nav-drawer__divider"></div>
        <button class="nav-drawer__item nav-drawer__item--logout" data-nav="logout">
          <span class="material-symbols-outlined">logout</span>
          Log out
        </button>
      </nav>
    </aside>
  `

  const burgerBtn = document.getElementById('burger-btn')
  const tvBtn     = document.getElementById('tv-toggle-btn')
  const drawer    = document.getElementById('nav-drawer')
  const overlay   = document.getElementById('drawer-overlay')
  const closeBtn  = document.getElementById('drawer-close')

  function openDrawer() {
    drawer.hidden = false
    overlay.classList.add('is-visible')
    burgerBtn.setAttribute('aria-expanded', 'true')
    setTimeout(() => drawer.classList.add('is-open'), 10)
  }

  function closeDrawer() {
    drawer.classList.remove('is-open')
    overlay.classList.remove('is-visible')
    burgerBtn.setAttribute('aria-expanded', 'false')
    setTimeout(() => { drawer.hidden = true }, 250)
  }

  tvBtn.addEventListener('click', () => {
    state.isForcedLandscape = !state.isForcedLandscape
    localStorage.setItem('bti_force_landscape', state.isForcedLandscape)
    
    if (state.isForcedLandscape) {
      document.body.classList.add('force-landscape')
      tvBtn.style.color = '#fff'
      tvBtn.title = 'Exit TV Mode'
    } else {
      document.body.classList.remove('force-landscape')
      tvBtn.style.color = '#888'
      tvBtn.title = 'Enter TV Mode'
    }

    // Refresh current view to apply landscape logic if needed
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })

  burgerBtn.addEventListener('click', openDrawer)
  closeBtn.addEventListener('click', closeDrawer)
  overlay.addEventListener('click', closeDrawer)

  drawer.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeDrawer()
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
