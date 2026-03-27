import { navigate } from '../router.js'
import { getDevices } from '../api/spotify-api.js'
import { state } from '../state.js'
import { showToast } from '../components/toast.js'

const app = document.getElementById('app')

export async function renderDevices() {
  app.innerHTML = `
    <div class="view">
      <div class="view__inner space-y-8">
        <div>
          <h2 class="display-heading">Output <span class="accent">Device</span></h2>
          <p class="text-muted text-xs tracking-wide uppercase mt-2">Choose where the music plays</p>
        </div>

        <div id="device-list" class="space-y-4">
          <div class="skeleton" style="height:80px;width:100%"></div>
          <div class="skeleton" style="height:80px;width:100%"></div>
        </div>

        <button id="back-btn" class="btn btn--ghost btn--full">Back to Settings</button>
      </div>
    </div>
  `

  document.getElementById('back-btn').addEventListener('click', () => navigate('/settings'))

  try {
    const { devices } = await getDevices()
    state.availableDevices = devices
    renderList(devices)
  } catch (err) {
    console.error(err)
    showToast('Could not load devices', 'error')
  }
}

function renderList(devices) {
  const list = document.getElementById('device-list')
  if (!list) return

  const items = [
    // Local device option
    {
      id: null,
      name: 'This Browser',
      type: 'Computer',
      is_active: !state.activeDeviceId
    },
    ...devices
  ]

  list.innerHTML = items.map(d => {
    const isActive = d.id === state.activeDeviceId || (!d.id && !state.activeDeviceId)
    const icon = getDeviceIcon(d.type)
    
    return `
      <div class="card device-card ${isActive ? 'device-card--active' : ''}" data-id="${d.id || ''}">
        <div style="display:flex;align-items:center;gap:1.5rem">
          <span class="material-symbols-outlined" style="font-size:2rem;color:${isActive ? '#D1FF00' : 'inherit'}">
            ${icon}
          </span>
          <div style="flex:1">
            <p style="font-weight:900;text-transform:uppercase;margin:0;font-size:1.125rem">
              ${isActive ? '<span class="text-volt">● </span>' : ''}${d.name}
            </p>
            <p class="text-xs text-muted tracking-widest uppercase mt-1">${d.type}</p>
          </div>
          ${isActive ? '<span class="badge badge--success">Active</span>' : ''}
        </div>
      </div>
    `
  }).join('')

  list.querySelectorAll('.device-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id || null
      state.activeDeviceId = id
      showToast(`Output set to ${id ? 'remote device' : 'this browser'}`, 'success')
      renderList(devices)
    })
  })
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
