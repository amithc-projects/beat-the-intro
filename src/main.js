import { register, startRouter, navigate } from './router.js'
import { getAccessToken, handleCallback, isTokenExpired, refreshToken } from './auth/spotify-auth.js'
import { getUser } from './api/spotify-api.js'
import { state } from './state.js'
import { renderNav, clearNav } from './components/navbar.js'
import { showToast } from './components/toast.js'

// Views
import { renderLogin } from './views/login.js'
import { renderPremiumGate } from './views/premium-gate.js'
import { renderPlaylists } from './views/playlists.js'
import { renderConfig } from './views/config.js'
import { renderPlaying } from './views/playing.js'
import { renderGuessing } from './views/guessing.js'
import { renderRoundResult } from './views/round-result.js'
import { renderSummary } from './views/summary.js'
import { renderShare } from './views/share.js'
import { renderReady } from './views/ready.js'
import { renderSettings } from './views/settings.js'
import { renderCookiePolicy } from './views/cookie-policy.js'
import { renderPrivacyPolicy } from './views/privacy-policy.js'
import { renderHowToPlay } from './views/how-to-play.js'
import { renderDevices } from './views/devices.js'

// ── Preserve share route before OAuth wipes the hash ──────────────────────────
const initialHash = window.location.hash
if (initialHash.startsWith('#/play?tracks=')) {
  localStorage.setItem('pendingShareRoute', initialHash)
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
async function ensureToken() {
  if (isTokenExpired()) {
    try {
      await refreshToken()
    } catch {
      return false
    }
  }
  return !!getAccessToken()
}

async function loadUser() {
  if (state.user) return true
  try {
    state.user = await getUser()
    return true
  } catch {
    return false
  }
}

// ── Route guards ───────────────────────────────────────────────────────────────
async function authRequired(renderFn) {
  const ok = await ensureToken()
  if (!ok) { navigate('/login'); return }
  const loaded = await loadUser()
  if (!loaded) { navigate('/login'); return }
  if (state.user.product !== 'premium') { navigate('/gate'); return }
  renderNav(state.user)
  renderFn()
}

function noNav(renderFn) {
  clearNav()
  renderFn()
}

// ── Register routes ────────────────────────────────────────────────────────────
register('/login',    () => noNav(renderLogin))
register('/gate',     () => noNav(renderPremiumGate))
register('/playlists',() => authRequired(renderPlaylists))
register('/config',   () => authRequired(renderConfig))
register('/ready',    () => authRequired(renderReady))
register('/play',     () => authRequired(renderPlaying))
register('/guess',    () => authRequired(renderGuessing))
register('/result',   () => authRequired(renderRoundResult))
register('/summary',  () => authRequired(renderSummary))
register('/share',    () => authRequired(renderShare))
register('/settings', () => authRequired(renderSettings))
register('/cookies',    () => authRequired(renderCookiePolicy))
register('/privacy',    () => authRequired(renderPrivacyPolicy))
register('/how-to-play',() => authRequired(renderHowToPlay))
register('/devices',    () => authRequired(renderDevices))

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function init() {
  // Handle OAuth callback
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (code) {
    try {
      await handleCallback(code)
      window.history.replaceState({}, document.title, window.location.pathname)

      // Restore pending share route
      const pending = localStorage.getItem('pendingShareRoute')
      if (pending) {
        localStorage.removeItem('pendingShareRoute')
        window.location.hash = pending
      } else {
        window.location.hash = '#/playlists'
      }
    } catch (err) {
      console.error('Auth callback failed', err)
      window.location.hash = '#/login'
    }
    startRouter()
    return
  }

  startRouter()
}

init()
