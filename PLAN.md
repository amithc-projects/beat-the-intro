# Beat the Intro — Implementation Plan

## Context
A Spotify music guessing game. Users connect their Spotify Premium account, pick a playlist, configure rounds, then try to identify the artist and song title as quickly as possible while a random track plays from the beginning. Includes sharing, analytics event tracking, cookie/privacy policy, and a persistent nav bar.

The `stitch/` folder contains per-view HTML mockups and screen images for **conceptual flow reference only**. Visual implementation uses Aurora UI components restyled with the "Volt Zine" design language. Do not copy the Tailwind-based mockup code directly.

---

## Tech Stack
- **Vanilla JS + Vite** (no framework, ES modules throughout)
- **Aurora UI** — cloned inside project at `aurora-docs/` (gitignored). CSS: `aurora-docs/static/css/core.css` + `aurora-docs/static/css/aurora.css`. JS: `aurora-docs/static/js/`
- **Volt Zine theme** — `src/styles.css` overrides Aurora CSS variables and components with the custom design language (see Design System section below)
- **Spotify PKCE OAuth** — fully client-side, no backend. `http://localhost:5173/callback` works for local dev; production uses Netlify/Vercel HTTPS URL
- **Spotify Web Playback SDK** — `https://sdk.scdn.co/spotify-player.js`
- **Spotify Web API** — REST for user, playlists, tracks, playback
- **Deployment** — Netlify or Vercel (free tier, auto-deploy from git, provides HTTPS URL needed for mobile/TV screencast testing)

---

## View Reference Index

| Code | Name | Route |
|------|------|--------|
| **LGN** | Login | `#/login` |
| **GAT** | Premium Gate | `#/gate` |
| **PLS** | Playlist Selection | `#/playlists` |
| **CFG** | Game Configuration | `#/config` |
| **PLY** | Playing | `#/play` |
| **GSS** | Guessing | `#/guess` |
| **RND** | Round Result | `#/result` |
| **SUM** | Game Summary | `#/summary` |
| **SHR** | Share | `#/share` |
| **SET** | Settings | `#/settings` |
| **CKP** | Cookie Policy | `#/cookies` |
| **PRV** | Privacy Policy | `#/privacy` |

**NAV** = persistent top navigation bar, present on all views except LGN and GAT.

---

## Visual Flow Diagram

```
╔══════════════════════════════════════════════════════════╗
║                   UNAUTHENTICATED                        ║
║                                                          ║
║  ┌─────┐  OAuth + callback  ┌─────┐  free user  ┌─────┐ ║
║  │ LGN │───────────────────▶│ LGN │────────────▶│ GAT │ ║
║  └─────┘                    └──┬──┘             └──┬──┘ ║
║                                │ premium           │     ║
╚════════════════════════════════│═══════════════════│═════╝
                                 ▼                   │ try again
                              ┌─────┐               ▼
                              │ PLS │            ┌─────┐
                              │     │            │ LGN │
                              └──┬──┘            └─────┘
                                 │ select playlist
                                 ▼
                              ┌─────┐
                    ┌────────▶│ CFG │◀──────────────────┐
                    │         └──┬──┘                    │
                    │            │ start game            │ new playlist
                    │            ▼                       │
         ┌──────────┴──── GAME LOOP ────────────┐       │
         │                                       │       │
         │  ┌─────┐  pause   ┌─────┐  submit    │       │
         │  │ PLY │─────────▶│ GSS │────────┐   │       │
         │  └──▲──┘  resume  └─────┘        │   │       │
         │     │    (back)                  ▼   │       │
         │     │                         ┌─────┐│       │
         │     │   next round            │ RND ││       │
         │     │   (rounds remain)       └──┬──┘│       │
         │     └────────────────────────────┘   │       │
         │                                       │       │
         │              last round done          │       │
         └───────────────────────────────────────┘       │
                              │                          │
                              ▼                          │
                           ┌─────┐  play again ─────────┘
                           │ SUM │
                           └──┬──┘
                              │ share
                              ▼
                           ┌─────┐
                           │ SHR │
                           └─────┘

  FROM NAV (all authenticated views → SET, CKP, PRV, LGN/logout):
  ┌─────┐  ┌─────┐  ┌─────┐  ┌──────────┐
  │ SET │  │ CKP │  │ PRV │  │LGN logout│
  └─────┘  └─────┘  └─────┘  └──────────┘
```

---

## View Specifications

### NAV — Navigation Bar (infrastructure, all authenticated views)
- Spotify profile picture (avatar) or silhouette if not loaded
- User display name
- Settings link → **SET**
- Cookie Policy link → **CKP**
- Privacy Policy link → **PRV**
- Logout button → clears sessionStorage, navigates → **LGN**
- **Aurora components:** Avatar, Button (ghost/icon), Divider

---

### LGN — Login
**Route:** `#/login` | No NAV
**Purpose:** Entry point, initiates Spotify OAuth
**Aurora components:**
- Image (logo / hero graphic)
- Button (primary — "Connect with Spotify")
- Links to CKP and PRV (footer)

---

### GAT — Premium Gate
**Route:** `#/gate` | No NAV
**Purpose:** Block free-tier users with explanation
**Aurora components:**
- Alert (error variant — "Spotify Premium required")
- Button (secondary — "Try a different account" → LGN)

---

### PLS — Playlist Selection
**Route:** `#/playlists` | Has NAV
**Purpose:** Show user's playlists, pick one to play
**Aurora components:**
- Skeleton Loading (while fetching playlists)
- Cards (horizontal — cover image, playlist name, track count Badge)
- Pagination (if >12 playlists)
- Toast (error — if fetch fails)

---

### CFG — Game Configuration
**Route:** `#/config` | Has NAV
**Purpose:** Configure game before starting
**Aurora components:**
- Card (selected playlist summary — cover, name)
- Segmented Control (rounds: 3 / 5 / 10 / Custom)
- Number Input (shown when "Custom" selected, min 1 max 20)
- Button (primary — "Start Game")
- Button (ghost — "Back to Playlists" → PLS)

**Round count cap:** `effectiveRounds = Math.min(userChoice, playableTracks.length)`. If `playableTracks.length < userChoice`, show an inline note: e.g. "Only 8 playable tracks available — game will use 8 rounds." Never allow 0 rounds (redirect back to PLS with a Toast if the playlist has no playable tracks).

---

### PLY — Playing
**Route:** `#/play` | Has NAV
**Purpose:** Track is playing, timer running, user listens
**Aurora components:**
- Badge (round indicator — "Round 2 of 5")
- Card (track info hidden — blurred/placeholder album art)
- **Animated waveform visualizer** — CSS-only animated equalizer bars (no Web Audio API). The Spotify SDK gives no access to the audio stream, so the Aurora canvas cannot be driven by real frequency data. Instead: a row of `<span>` bars animated with CSS `@keyframes` that run when a `.is-playing` class is present on the container and pause otherwise. Styled volt-green bars on dark background, varying heights and animation delays to simulate a live waveform.
- Timer display (elapsed seconds — custom styled `<time>` element, driven by Aurora's timecode readout)
- Button (primary — "Pause & Guess")

---

### GSS — Guessing
**Route:** `#/guess` | Has NAV
**Purpose:** Playback paused, user enters their guess
**Aurora components:**
- Badge (round indicator)
- Card (track still hidden)
- Text Field (Artist Name)
- Text Field (Song Title)
- Button (primary — "Submit Guess")
- Button (ghost — "Resume Listening" → PLY, resumes playback)

**Fuzzy matching (src/game/game-engine.js):** Use [Fuse.js](https://fusejs.io/) for guess comparison. Before comparing, normalise both sides: lowercase, strip `(feat. ...)`, ` - Remastered`, ` - Radio Edit`, and similar suffixes via a shared `normaliseTitle(str)` helper. Fuse threshold `0.35` (lower = stricter). Scoring:
- Both artist + title fuzzy-match → `isCorrect: true`, full point
- Title matches but not artist (or vice versa) → `isCorrect: false`, still show what was right in RND
- Neither matches → `isCorrect: false`

---

### RND — Round Result
**Route:** `#/result` | Has NAV
**Purpose:** Reveal correct answer, show if guess was right
**Aurora components:**
- Image (album artwork — revealed)
- Badge (success "Correct" or error "Incorrect")
- Text (artist name + song title revealed)
- Text (running score — "2 correct so far")
- Toast (auto-dismiss — correct/incorrect feedback)
- Button (primary — "Next Round" → PLY, or "See Summary" if last round → SUM)

---

### SUM — Game Summary
**Route:** `#/summary` | Has NAV
**Purpose:** End-of-game overview — score, time, share
**Aurora components:**
- Card (final score — X correct out of Y rounds)
- Card (total time taken)
- Timeline or list of Cards (round-by-round: track name, guess, correct/incorrect, time)
- Button (primary — "Share Result" → SHR)
- Button (secondary — "Play Again" same playlist → CFG)
- Button (ghost — "Choose New Playlist" → PLS)

---

### SHR — Share
**Route:** `#/share` | Has NAV
**Purpose:** Share score + game link with others
**Share payload:** playlist ID + ordered track IDs (so recipient plays exact same tracks)
**Share message:** `"I got {n} correct in {totalSeconds}s total. Can you beat that?"`
**Share URL format:** `https://[app-url]/#/play?playlist={id}&tracks={t1,t2,...}`
**Aurora components:**
- Card (share message preview)
- Text Field (readonly — share URL)
- Button (primary — "Copy Link", uses Clipboard API)
- Button (secondary — "Share" via Web Share API if available)
- Button (ghost — "Back to Summary" → SUM)

---

### SET — Settings
**Route:** `#/settings` | Has NAV
**Purpose:** User preferences
**Aurora components:**
- Switch/Toggle (Dark / Light theme)
- Button (primary — "Save")
- Button (ghost — "Back")

---

### CKP — Cookie Policy
**Route:** `#/cookies` | Has NAV
**Purpose:** Legal — cookie usage disclosure
**Aurora components:**
- Static text content with Aurora typography
- Breadcrumb (Home > Cookie Policy)

---

### PRV — Privacy Policy
**Route:** `#/privacy` | Has NAV
**Purpose:** Legal — data/privacy disclosure
**Aurora components:**
- Static text content with Aurora typography
- Breadcrumb (Home > Privacy Policy)

---

## Module Structure

```
beat-the-intro/
├── aurora-docs/              ← cloned, gitignored
├── public/
│   └── favicon.ico
├── src/
│   ├── main.js               ← bootstrap: init router, check auth, mount app
│   ├── router.js             ← hash-based router, maps #/route → view
│   ├── state.js              ← central app state store (user, game, playlist)
│   ├── events.js             ← Aurora event tracking wrapper (console.log for now)
│   │
│   ├── auth/
│   │   └── spotify-auth.js   ← PKCE: generateVerifier, generateChallenge,
│   │                            redirectToSpotify, handleCallback,
│   │                            getToken, refreshToken, logout
│   │
│   ├── api/
│   │   └── spotify-api.js    ← getUser, getPlaylists, getPlaylistTracks,
│   │                            startPlayback (all with auto-pagination)
│   │
│   ├── player/
│   │   └── playback.js       ← SDK init, play(uri), pause(), resume(),
│   │                            onStateChange(cb), getCurrentPosition()
│   │                            (see Mobile Playback section below)
│   │                            NOTE: window.onSpotifyWebPlaybackSDKReady must be
│   │                            set at module top-level (not inside initPlayer).
│   │                            Use a playerReadyPromise so initPlayer can await
│   │                            device_id regardless of when the SDK fires ready.
│   │                            Token refresh is handled inside getOAuthToken callback.
│   │
│   ├── game/
│   │   └── game-engine.js    ← state machine, round logic, score tracking,
│   │                            timer, random track selection, share payload builder
│   │
│   ├── components/
│   │   └── navbar.js         ← NAV render + logout handler
│   │
│   ├── views/
│   │   ├── login.js          ← LGN
│   │   ├── premium-gate.js   ← GAT
│   │   ├── playlists.js      ← PLS
│   │   ├── config.js         ← CFG
│   │   ├── playing.js        ← PLY
│   │   ├── guessing.js       ← GSS
│   │   ├── round-result.js   ← RND
│   │   ├── summary.js        ← SUM
│   │   ├── share.js          ← SHR
│   │   ├── settings.js       ← SET
│   │   ├── cookie-policy.js  ← CKP
│   │   └── privacy-policy.js ← PRV
│   │
│   └── styles.css            ← layout + game-specific overrides on Aurora
│
├── index.html                ← links Aurora CSS, Spotify SDK script, <div id="app">
├── vite.config.js
├── .env                      ← VITE_SPOTIFY_CLIENT_ID, VITE_REDIRECT_URI
└── .gitignore                ← node_modules, dist, .env, aurora-docs/
```

---

## Responsive Design Requirements

The app must work across three layouts with no horizontal scrolling and minimal vertical scrolling:

| Context | Orientation | Priority |
|---------|------------|----------|
| Mobile phone | Portrait | Standard browsing |
| Mobile phone | Landscape | **Screencast to TV** — treat as the primary "big screen" experience |
| Desktop | — | Full experience |

### Breakpoints
- **Portrait mobile:** `max-width: 480px` — single column, stacked layout, large tap targets
- **Landscape mobile:** `max-width: 896px` + `orientation: landscape` — everything fits in one screen height, zero scrolling. Treat as "TV mode": large text, album art prominent, controls anchored to bottom/sides.
- **Desktop:** `min-width: 897px` — standard layout with card grids

### Per-view layout rules

**LGN / GAT** — centred single column on all breakpoints. Logo scales down on mobile.

**PLS** — Desktop: 3-col card grid. Portrait: 1-col list. Landscape mobile: 2-col grid, shorter cards — fits 4–6 playlists without scrolling; pagination handles the rest.

**CFG** — Single centred column on all breakpoints. Segmented control full-width on mobile.

**PLY** *(most critical for TV mode)*
- Landscape mobile: album art (blurred) fills left ~40% of viewport height; Aurora audio player canvas sits above the controls on the right; "Pause & Guess" button large, bottom-right, thumb-reachable. Zero scrolling.
- Portrait: stacked vertically, blurred art on top, Aurora audio player (canvas + controls) below art, "Pause & Guess" at the bottom.

**GSS** — Landscape mobile: Artist + Song Title fields side-by-side in one row; Submit + Resume buttons on same row below. Entire view fits in one screen.

**RND** — Landscape mobile: album art left, result info right (two-column). Badge, artist/title, score, and Next Round button all visible without scrolling.

**SUM** — Landscape mobile: score + time cards in a row at top; round breakdown as a compact horizontal-scroll strip; Share / Play Again / New Playlist in a single button row at bottom.

**SHR** — Single centred column on all breakpoints. Share URL field full-width.

**NAV** — Landscape mobile: max height 40px, icon-only buttons with tooltips to preserve vertical space for content.

### General mobile rules
- All interactive elements minimum **44×44px** tap target
- Input font size minimum **16px** (prevents iOS auto-zoom)
- Aurora CSS custom properties used for spacing scale-down at mobile sizes
- No fixed-height elements that overflow on small screens
- Test viewports: `375×667` (iPhone SE portrait), `667×375` (iPhone SE landscape), `390×844` (iPhone 14 portrait), `844×390` (iPhone 14 landscape), `1440×900` (desktop)

### CSS approach
- `src/styles.css` uses three `@media` blocks: default (mobile-first portrait), landscape mobile, desktop
- Aurora utility classes handle most of the base layout; overrides only where Aurora doesn't cover the TV/landscape case
- CSS Grid used for PLY, GSS, RND landscape layouts (not flexbox) so proportions hold when screencasted

---

## src/events.js — Event Tracking
Thin wrapper. All Aurora interaction events and game events routed through here.
Currently logs to console; swap `console.log` for analytics platform call later.
```
track(eventName, properties)  // e.g. track('playlist_selected', { id, name, trackCount })
```
Key events to track:
- `login_initiated`, `login_success`, `login_failed_premium`
- `playlist_selected`, `game_started`, `round_started`
- `guess_submitted`, `guess_correct`, `guess_incorrect`
- `game_completed`, `game_shared`
- `logout`

---

## Game State Machine (src/game/game-engine.js)

**States:**
```
IDLE → AUTHENTICATING → PREMIUM_CHECK → PLAYLIST_SELECT
     → CONFIGURING → ROUND_LOADING → PLAYING → GUESSING
     → ROUND_RESULT → [next round: ROUND_LOADING | game over: SUMMARY]
     → SHARING
```

**Game session data:**
- `playlist` — selected playlist object
- `totalRounds` — chosen by user (3/5/10/custom)
- `currentRound` — 1-indexed
- `tracks[]` — pre-shuffled, filtered track list (no is_local)
- `rounds[]` — array of `{ track, guess, isCorrect, elapsedMs }`
- `startTime` — per-round timestamp
- `totalElapsedMs` — sum across all rounds
- `sharePayload` — `{ playlistId, trackIds[], score, totalSeconds }`

---

## Design System: Volt Zine

The visual language is defined in `stitch/voltage_zine/DESIGN.md`. Aurora provides structure and JS behaviour; `src/styles.css` overrides the Aurora CSS custom properties and components to match this aesthetic.

### Colour tokens (override Aurora CSS vars)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface` | `#131313` | App background |
| `--color-surface-container-low` | `#1b1b1b` | Card backgrounds |
| `--color-surface-container-high` | `#2a2a2a` | Elevated surfaces |
| `--color-surface-container-highest` | `#353535` | Highest elevation |
| `--color-primary` | `#ffffff` | White — primary text/borders |
| `--color-primary-container` | `#D1FF00` | **Volt** — CTAs, active states, accents |
| `--color-on-primary-container` | `#000000` | Text on Volt backgrounds |
| `--color-on-surface` | `#e2e2e2` | Body text |
| `--color-on-surface-variant` | `#c5c9ac` | Secondary text |
| `--color-error` | `#ffb4ab` | Error states |
| `--color-outline-variant` | `#444933` | Subtle borders |

### Typography
- **Font:** Space Grotesk (loaded from Google Fonts)
- **Display headings:** `font-black`, `italic`, `tracking-tighter`, `uppercase`, negative letter-spacing
- **Labels / metadata:** `font-bold`, `tracking-widest`, `uppercase`, small caps feel
- Override Aurora's font stack via `--font-family-base: 'Space Grotesk', sans-serif`

### Component overrides in `src/styles.css`
- **Border radius:** Override to `0px` everywhere (`--radius-*: 0`)
- **Buttons (primary):** Volt fill, black text, hard 4px offset shadow in white (`box-shadow: 4px 4px 0 0 #fff`). On active: translate 2px, remove shadow.
- **Buttons (ghost/tertiary):** No fill, 2px white border
- **Progress bar:** 8px tall, Volt indicator, white/transparent track, square ends
- **Input fields:** `surface-container-high` background, thick bottom border in white, on focus full 2px Volt outline
- **Cards:** No dividers — use background alternation and `0.6rem` vertical gap
- **Nav bar:** `border-bottom: 4px solid #D1FF00`, compact height on landscape mobile
- **Grain overlay:** Fixed `::before` pseudo-element on `body` with SVG noise at 5% opacity, `pointer-events: none`

### Do / Don't (from DESIGN.md)
- **Do:** 0px radii, overlapping text on images, white space via large padding, hard offset shadows
- **Don't:** Soft gradients, 1px grey lines, perfectly centred layouts (prefer left-aligned brutal stacks)

---

## Deployment

### Local dev
- `http://localhost:5173` — Spotify PKCE callback to `http://localhost:5173/callback` works without HTTPS
- Register `http://localhost:5173/callback` in Spotify app dashboard

### Production (Netlify or Vercel)
- Connect git repo → auto-deploy on push
- Add env var `VITE_SPOTIFY_CLIENT_ID` in the platform dashboard
- Set `VITE_REDIRECT_URI` to `https://your-app.netlify.app/callback`
- Register the production redirect URI in Spotify app dashboard
- Production HTTPS URL is what you use for mobile / TV screencast testing

---

## src/auth/spotify-auth.js — PKCE Flow

**Storage:** All auth state goes in `localStorage` (not `sessionStorage`) so the user stays logged in across page refreshes. This is what makes the "already logged in" fast-path work.

**PKCE steps:**
1. `generateCodeVerifier()` → 128-char random string using `crypto.getRandomValues` (not `Math.random`) → store in `localStorage` as `spotify_code_verifier`
2. `generateCodeChallenge(verifier)` → SHA-256 via `crypto.subtle.digest` → base64url
3. Before `redirectToSpotify()`: if `window.location.hash` starts with `#/play?tracks=`, save it to `localStorage` as `pendingShareRoute`
4. `redirectToSpotify()` → `https://accounts.spotify.com/authorize?...&code_challenge=...`
5. Spotify redirects to `VITE_REDIRECT_URI?code=xxx&state=yyy`
6. `handleCallback()` → POST to `https://accounts.spotify.com/api/token` → store `access_token`, `refresh_token`, and `expiry` timestamp in `localStorage`
7. After tokens stored: check `localStorage.getItem('pendingShareRoute')` — if present, remove it and navigate there; otherwise navigate to `#/playlists`
8. `logout()` → clear all `spotify_*` keys from `localStorage` → navigate to LGN

**Scopes:** `streaming user-read-private user-read-email playlist-read-private user-modify-playback-state`

---

## src/api/spotify-api.js — Pagination

All paginated endpoints follow this pattern:
```js
async function fetchAll(url, token) {
  let items = [], next = url
  while (next) {
    const data = await apiFetch(next, token)
    items = items.concat(data.items)
    next = data.next
  }
  return items
}
```
`getPlaylistTracks` additionally filters:
- `item => item.track && !item.track.is_local` — skip local files
- `item => item.track.is_playable !== false` — skip regionally unavailable tracks

Pass `market` query param (from `getUser().country`) to both `getPlaylistTracks` and `startPlayback` so Spotify returns correct `is_playable` values. Without `market`, `is_playable` is absent and filtering has no effect.

---

## index.html Key Structure
```html
<link rel="stylesheet" href="/aurora-docs/static/css/core.css">
<link rel="stylesheet" href="/aurora-docs/static/css/aurora.css">
<link rel="stylesheet" href="/src/styles.css">
<script src="https://sdk.scdn.co/spotify-player.js"></script>
<div id="nav"></div>
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

---

## Share URL Format
```
https://[app-url]/#/play?playlist={playlistId}&tracks={id1,id2,id3,...}
```
Recipient clicking the link loads the app, after auth they are taken directly to PLY with the same tracks in the same order.

### Share Link + OAuth Flow (deferred game state)
The OAuth redirect wipes the URL fragment, so the share params must be preserved manually:

1. On app load, before any auth check: if `window.location.hash` starts with `#/play?tracks=`, save it to `localStorage` as `pendingShareRoute`.
2. `redirectToSpotify()` proceeds normally (no change needed).
3. After `handleCallback()` succeeds and tokens are stored, check `localStorage.getItem('pendingShareRoute')`. If present, remove it and navigate to that route instead of the default `#/playlists`.

This is handled in `src/main.js` at bootstrap, not inside the auth module.

---

## Mobile Playback Strategy

**Tested result:** The Spotify Web Playback SDK works on **Android Chrome** (confirmed in proof-of-concept). The primary concern is **iOS Safari**, which does not support the SDK.

**Detection:** Attempt SDK init normally. If `ready` never fires within 5s, set `sdkReady = false`.

**Fallback strategy for iOS (Web API Bridge):**
- When `sdkReady = false`, use the Spotify REST API `PUT /me/player/play` to trigger playback on the user's **active Spotify app** instead of the in-browser player.
- `getAvailableDevices()` → `GET /me/player/devices` — if no devices found, show a Toast: "Open Spotify on another device to enable playback."
- `transferPlayback(deviceId)` → `PUT /me/player` — switch playback to chosen device.
- Playback state polling: use `setInterval` calling `GET /me/player` every 1s to update the progress bar (SDK state change callback won't fire).

**PLY view on iOS fallback:** Hide the Aurora audio player canvas and show a compact status line: "Playing on: [device name]" with the progress bar driven by polling.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `fuse.js` | Fuzzy string matching for guess evaluation |

Install: `npm install fuse.js`

---

## Setup Steps
1. `npm create vite@latest . -- --template vanilla`
2. `git clone https://github.com/amithc-projects/aurora-docs.git aurora-docs` (inside project dir)
3. Add Space Grotesk to `index.html`: `<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=swap" rel="stylesheet">`
4. Create Spotify app at developer.spotify.com → add `http://localhost:5173/callback` as redirect URI
5. Copy Client ID into `.env` as `VITE_SPOTIFY_CLIENT_ID`
6. `npm install && npm run dev`
7. For production: connect repo to Netlify/Vercel → set env vars → add production callback URI to Spotify app dashboard

---

## Verification Checklist
1. `npm run dev` → app loads at `http://localhost:5173`
2. LGN: "Connect with Spotify" → Spotify auth page
3. Return with Premium account → PLS shows playlists with skeleton then cards
4. Return with free account → GAT shows alert, "Try different account" returns to LGN
5. Select playlist → CFG: choose 3 rounds, click Start
6. PLY: track plays from 0:00, timer counts up, progress bar moves
7. Click "Pause & Guess" → GSS: playback pauses, form shown
8. Click "Resume Listening" → PLY: playback resumes
9. Submit correct guess → RND: green badge, correct toast, "Next Round"
10. Submit wrong guess → RND: red badge, error toast, correct answer revealed
11. After 3 rounds → SUM: score, time, round breakdown
12. SUM → SHR: share URL contains playlist + track IDs, copy works
13. NAV: logout clears session → LGN
14. NAV: settings → SET, cookie → CKP, privacy → PRV
15. Console shows all tracked events throughout
