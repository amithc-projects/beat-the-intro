import { navigate } from '../router.js'
import { showToast } from '../components/toast.js'
import { getDevices } from '../api/spotify-api.js'
import { state } from '../state.js'

const app = document.getElementById('app')

export async function renderSettings() {
  const isDark = document.documentElement.classList.contains('dark') ||
                 localStorage.getItem('theme') !== 'light'

  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-8">
        <h2 class="display-heading">Settings</h2>

        <div class="card space-y-6">
          <!-- Theme Toggle -->
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="font-weight:700;text-transform:uppercase;letter-spacing:-0.01em;margin:0">Dark Mode</p>
              <p class="text-muted text-xs tracking-wide uppercase mt-2">Volt Zine aesthetic</p>
            </div>
            <label style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer">
              <input id="theme-toggle" type="checkbox" ${isDark ? 'checked' : ''} style="opacity:0;width:0;height:0">
              <span id="toggle-track" style="
                position:absolute;inset:0;background:${isDark ? '#D1FF00' : '#444'};
                transition:background 200ms;display:flex;align-items:center;padding:2px">
                <span id="toggle-thumb" style="
                  width:22px;height:22px;background:#000;
                  transform:${isDark ? 'translateX(22px)' : 'translateX(0)'};
                  transition:transform 200ms;flex-shrink:0"></span>
              </span>
            </label>
          </div>

          <div style="height:1px;background:var(--ds-sys-color-outline-variant)"></div>

          <!-- Device Selector -->
          <div id="device-trigger" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
            <div>
              <p style="font-weight:700;text-transform:uppercase;letter-spacing:-0.01em;margin:0">
                Select output device
                <span id="device-count" class="text-volt" style="margin-left:0.5rem">...</span>
              </p>
              <p class="text-muted text-xs tracking-wide uppercase mt-2">Play via Spotify Connect</p>
            </div>
            <span class="material-symbols-outlined">chevron_right</span>
          </div>
        </div>

        <div class="space-y-4">
          <button id="save-btn" class="btn btn--primary btn--full">
            <span class="material-symbols-outlined">save</span>
            Save
          </button>
          <button id="back-btn" class="btn btn--ghost btn--full">Back</button>
        </div>
      </div>
    </div>
  `

  const toggle = document.getElementById('theme-toggle')
  const toggleTrack = document.getElementById('toggle-track')
  const toggleThumb = document.getElementById('toggle-thumb')
  const deviceTrigger = document.getElementById('device-trigger')
  const deviceCount = document.getElementById('device-count')

  // Theme logic
  toggle.addEventListener('change', () => {
    toggleTrack.style.background = toggle.checked ? '#D1FF00' : '#444'
    toggleThumb.style.transform  = toggle.checked ? 'translateX(22px)' : 'translateX(0)'
  })

  // Device logic
  deviceTrigger.addEventListener('click', () => navigate('/devices'))

  try {
    const { devices } = await getDevices()
    state.availableDevices = devices
    deviceCount.textContent = `(${devices.length + 1})` // +1 for "This Browser"
  } catch (err) {
    console.warn('Failed to fetch devices', err)
    deviceCount.textContent = '(?)'
  }

  document.getElementById('save-btn').addEventListener('click', () => {
    const theme = toggle.checked ? 'dark' : 'light'
    localStorage.setItem('theme', theme)
    showToast('Settings saved', 'success')
  })

  document.getElementById('back-btn').addEventListener('click', () => window.history.back())
}
