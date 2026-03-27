let container

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }
  return container
}

export function showToast(message, type = 'default', durationMs = 3000) {
  const el = document.createElement('div')
  el.className = `toast toast--${type}`
  el.textContent = message
  getContainer().appendChild(el)
  setTimeout(() => el.remove(), durationMs)
}
