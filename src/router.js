// Hash-based router
const routes = {}
let currentRoute = null

export function register(path, handler) {
  routes[path] = handler
}

export function navigate(path) {
  window.location.hash = path
}

export function currentPath() {
  const hash = window.location.hash.slice(1) // strip leading #
  // Strip query string for route matching
  return hash.split('?')[0] || '/login'
}

export function getQueryParams() {
  const hash = window.location.hash.slice(1)
  const qIndex = hash.indexOf('?')
  if (qIndex === -1) return {}
  return Object.fromEntries(new URLSearchParams(hash.slice(qIndex + 1)))
}

function dispatch() {
  const path = currentPath()
  const handler = routes[path]
  if (handler) {
    currentRoute = path
    handler()
  } else {
    // Fallback to login for unknown routes
    navigate('/login')
  }
}

export function startRouter() {
  window.addEventListener('hashchange', dispatch)
  dispatch()
}
