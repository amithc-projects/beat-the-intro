import { navigate } from '../router.js'
import { getDevices, playOnDevice, stopOnDevice } from '../api/spotify-api.js'
import { state } from '../state.js'
import { showToast } from '../components/toast.js'

const app = document.getElementById('app')

// A short, recognisable test track: "Never Gonna Give You Up" – Rick Astley
const TEST_TRACK_URI = 'spotify:track:4PTG3Z6ehGkBFwjybzWkR8'

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function escapeHtml(str) {
  return (str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getDeviceIcon(type) {
  switch (type?.toLowerCase()) {
    case 'computer':   return 'laptop'
    case 'smartphone': return 'smartphone'
    case 'speaker':    return 'speaker'
    case 'tv':         return 'tv'
    default:           return 'devices'
  }
}

export async function renderAudioSetup() {
  let selectedDeviceId = state.activeDeviceId
  let allDevices = []
  const iosMode = isIOS()

  async function showSelectPhase() {
    const infoText = iosMode
      ? 'iOS and iPadOS cannot play audio directly in the browser due to platform restrictions. Select a Spotify Connect device below — your phone, computer, or smart speaker.'
      : 'If you\'re having trouble hearing music, you can route playback to another Spotify device — your phone, computer, or smart speaker.'

    app.innerHTML = `
      <div class="view">
        <div class="view__inner space-y-8">
          <div>
            <h2 class="display-heading">Audio <span class="accent">Setup</span></h2>
            <p class="text-muted text-xs tracking-wide uppercase mt-2">Choose where the music plays</p>
          </div>

          <div class="card" style="padding:1.25rem;border-left:3px solid #D1FF00">
            <p style="font-size:0.875rem;line-height:1.6;margin:0 0 0.75rem">${infoText}</p>
            <p style="font-size:0.875rem;line-height:1.6;margin:0 0 0.75rem">
              <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle">smartphone</span>
              <strong>Start the Spotify app on the other device</strong>, then select it below.
            </p>
            <p style="font-size:0.8rem;color:#ff9800;margin:0">
              <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle">warning</span>
              Music can only play on <strong>one device</strong> at a time.
            </p>
          </div>

          <div>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <p class="section-label">Available Devices</p>
              <button id="refresh-btn" class="btn btn--icon" title="Refresh device list" aria-label="Refresh device list">
                <span class="material-symbols-outlined">refresh</span>
              </button>
            </div>
            <div id="device-list" class="space-y-3 mt-4">
              <div class="skeleton" style="height:72px"></div>
              <div class="skeleton" style="height:72px"></div>
            </div>
          </div>

          <div id="action-area"></div>

          <button id="skip-btn" class="btn btn--ghost btn--full">Skip for now</button>
        </div>
      </div>
    `

    document.getElementById('skip-btn').addEventListener('click', () => navigate('/playlists'))
    document.getElementById('refresh-btn').addEventListener('click', async () => {
      const list = document.getElementById('device-list')
      if (list) list.innerHTML = '<div class="skeleton" style="height:72px"></div><div class="skeleton" style="height:72px;margin-top:0.75rem"></div>'
      await loadDevices()
    })

    await loadDevices()
  }

  async function loadDevices() {
    try {
      const { devices } = await getDevices()
      // Active device first (most recently used), rest unchanged
      allDevices = [...devices].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0))
      renderDeviceList()
    } catch (err) {
      console.error('Failed to fetch devices', err)
      showToast('Could not load devices — is Spotify open?', 'error')
      renderDeviceError()
    }
  }

  function renderDeviceError() {
    const list = document.getElementById('device-list')
    if (!list) return
    list.innerHTML = `
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-muted text-xs">No devices found. Open Spotify on another device and try again.</p>
        <button id="retry-btn" class="btn btn--ghost btn--sm" style="margin-top:1rem">Retry</button>
      </div>
    `
    document.getElementById('retry-btn')?.addEventListener('click', async () => {
      const list = document.getElementById('device-list')
      if (list) list.innerHTML = '<div class="skeleton" style="height:72px"></div>'
      await loadDevices()
    })
  }

  function renderDeviceList() {
    const list = document.getElementById('device-list')
    if (!list) return

    if (allDevices.length === 0) {
      list.innerHTML = `
        <div class="card" style="padding:1rem;text-align:center">
          <p class="text-muted text-xs">No Spotify devices found. Open Spotify on your computer, phone, or speaker, then retry.</p>
          <button id="retry-btn" class="btn btn--ghost btn--sm" style="margin-top:1rem">Retry</button>
        </div>
      `
      document.getElementById('retry-btn')?.addEventListener('click', async () => {
        list.innerHTML = '<div class="skeleton" style="height:72px"></div>'
        await loadDevices()
      })
      updateActionArea()
      return
    }

    list.innerHTML = allDevices.map(d => {
      const isSelected = d.id === selectedDeviceId
      const icon = getDeviceIcon(d.type)
      return `
        <div class="card device-card ${isSelected ? 'device-card--active' : ''}" data-id="${escapeHtml(d.id)}" style="cursor:pointer">
          <div style="display:flex;align-items:center;gap:1.5rem">
            <span class="material-symbols-outlined" style="font-size:2rem;color:${isSelected ? '#D1FF00' : 'inherit'}">${icon}</span>
            <div style="flex:1">
              <p style="font-weight:900;text-transform:uppercase;margin:0;font-size:1rem">
                ${isSelected ? '<span class="text-volt">● </span>' : ''}${escapeHtml(d.name)}
              </p>
              <p class="text-xs text-muted tracking-widest uppercase mt-1">${escapeHtml(d.type)}</p>
            </div>
            ${isSelected ? '<span class="badge badge--success">Selected</span>' : ''}
          </div>
        </div>
      `
    }).join('')

    list.querySelectorAll('.device-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedDeviceId = card.dataset.id || null
        renderDeviceList()
        updateActionArea()
      })
    })

    updateActionArea()
  }

  function updateActionArea() {
    const area = document.getElementById('action-area')
    if (!area) return

    if (!selectedDeviceId) {
      area.innerHTML = ''
      return
    }

    const device = allDevices.find(d => d.id === selectedDeviceId)
    area.innerHTML = `
      <button id="test-btn" class="btn btn--primary btn--full">
        <span class="material-symbols-outlined">play_arrow</span>
        Test Audio on ${escapeHtml(device?.name || 'Selected Device')}
      </button>
    `

    document.getElementById('test-btn').addEventListener('click', () => startTest(device))
  }

  async function startTest(device) {
    if (!selectedDeviceId) return

    app.innerHTML = `
      <div class="view view--centered">
        <div class="view__inner space-y-8" style="text-align:center">
          <div>
            <h2 class="display-heading">Can You <span class="accent">Hear It?</span></h2>
            <p class="text-muted text-xs tracking-wide uppercase mt-2">Playing on ${escapeHtml(device?.name || 'your device')}</p>
          </div>

          <div class="card" style="padding:2rem">
            <span class="material-symbols-outlined" style="font-size:4rem;color:#D1FF00;display:block;margin-bottom:1rem">music_note</span>
            <p style="font-size:0.875rem;line-height:1.6;margin-bottom:0.5rem">
              Music should now be playing on <strong>${escapeHtml(device?.name || 'your device')}</strong>.
            </p>
            <p class="text-muted text-xs">Make sure the volume is turned up on that device.</p>
          </div>

          <div class="space-y-4">
            <button id="confirm-btn" class="btn btn--primary btn--full">
              <span class="material-symbols-outlined">check_circle</span>
              Yes, I can hear it!
            </button>
            <button id="retry-btn" class="btn btn--ghost btn--full">
              <span class="material-symbols-outlined">devices</span>
              Try a different device
            </button>
          </div>
        </div>
      </div>
    `

    try {
      await playOnDevice(selectedDeviceId, TEST_TRACK_URI)
    } catch (err) {
      console.error('Test playback failed', err)
      showToast('Could not start playback — make sure Spotify is open on the device', 'error')
      selectedDeviceId = null
      await showSelectPhase()
      return
    }

    document.getElementById('confirm-btn').addEventListener('click', async () => {
      state.activeDeviceId = selectedDeviceId
      await stopOnDevice(selectedDeviceId).catch(() => {})
      showToast(`Audio set to ${device?.name || 'selected device'}`, 'success')
      navigate('/playlists')
    })

    document.getElementById('retry-btn').addEventListener('click', async () => {
      await stopOnDevice(selectedDeviceId).catch(() => {})
      selectedDeviceId = null
      await showSelectPhase()
    })
  }

  await showSelectPhase()
}
