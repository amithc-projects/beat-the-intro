import { navigate } from '../router.js'
import { state } from '../state.js'
import { showToast } from '../components/toast.js'
import { track } from '../events.js'

const app = document.getElementById('app')

export function renderShare() {
  if (!state.sharePayload) { navigate('/summary'); return }

  const { playlistId, trackIds, score, totalSeconds } = state.sharePayload
  const appUrl = window.location.origin + window.location.pathname
  const shareUrl = `${appUrl}#/play?playlist=${playlistId}&tracks=${trackIds.join(',')}`
  const shareMsg = `I got ${score}/${state.totalRounds} correct in ${totalSeconds}s. Can you beat that?`

  app.innerHTML = `
    <div class="view view--centered">
      <div class="view__inner space-y-8">
        <div>
          <h2 class="display-heading">Share <span class="accent">Result</span></h2>
        </div>

        <div class="card" style="border-left:4px solid #D1FF00">
          <p style="font-weight:700;font-size:1rem;line-height:1.5;margin:0">${escHtml(shareMsg)}</p>
        </div>

        <div class="field">
          <label class="field__label">Share link</label>
          <input id="share-url" class="field__input" type="text" readonly value="${escHtml(shareUrl)}" style="cursor:pointer;font-size:0.75rem">
        </div>

        <div class="space-y-4">
          <button id="copy-btn" class="btn btn--primary btn--full">
            <span class="material-symbols-outlined">content_copy</span>
            Copy Link
          </button>
          ${navigator.share ? `
            <button id="native-share-btn" class="btn btn--secondary btn--full">
              <span class="material-symbols-outlined">ios_share</span>
              Share
            </button>
          ` : ''}
          <button id="back-btn" class="btn btn--ghost btn--full">Back to Summary</button>
        </div>
      </div>
    </div>
  `

  document.getElementById('copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Link copied!', 'success')
      track('game_shared', { method: 'copy' })
    } catch {
      document.getElementById('share-url').select()
      document.execCommand('copy')
      showToast('Link copied!', 'success')
    }
  })

  document.getElementById('native-share-btn')?.addEventListener('click', async () => {
    try {
      await navigator.share({ title: 'Beat the Intro', text: shareMsg, url: shareUrl })
      track('game_shared', { method: 'native' })
    } catch { /* user cancelled */ }
  })

  document.getElementById('back-btn').addEventListener('click', () => navigate('/summary'))
  document.getElementById('share-url').addEventListener('click', e => e.target.select())
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
