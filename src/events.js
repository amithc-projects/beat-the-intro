// Thin event tracking wrapper — swap console.log for analytics later
export function track(eventName, properties = {}) {
  console.log(`[event] ${eventName}`, properties)
}
