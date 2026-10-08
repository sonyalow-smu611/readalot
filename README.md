# Readalot 📖

A mobile-first social reading web app (IS216 group project). Each reader gets a virtual
**reading room** with a bookshelf, a currently-reading card and a window that shows the live
local weather, plus tabs to discover books, match books to a mood, meet nearby readers and
scan books onto a shelf.

The app is designed for a 390×844 phone viewport. It fills the screen on phones, and on wider
screens (from Bootstrap `sm` up to `xl`) it sits centred in a phone-style column over a decorated background.

> **Status: Phase 1 (frontend scaffold).** Theme, app shell, navigation, motion system, mock
> data and placeholder screens. Real features (Google Books search, Open-Meteo weather,
> shelves, people matching, scanning) come in later phases.

## Project structure

```
client/   Vue 3 + Vite single-page app (almost all of the project lives here)
server/   Thin Express server: health check now, API proxy routes in later phases
```

## Running the client

Requires Node.js 20+ (built with Node 24.12 / npm 11.6).

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build into client/dist
npm run preview    # serve the production build locally
```

Tip: in Chrome DevTools, use device mode at **390×844** (or iPhone 6/7/8 at 375 px) to see the
primary layout. Turn on *Rendering → Emulate CSS prefers-reduced-motion: reduce* to check the
reduced-motion path; the intro is skipped and animations are switched off.

## Running the server

```bash
cd server
npm install
npm start          # http://localhost:3000/api/health  ->  { "ok": true }
```

Phase 1 does not need the server running. The client reads only local mock JSON.

## Libraries used

| Library | Where | Purpose |
|---------|-------|---------|
| [Vue 3](https://vuejs.org/) | client | UI framework (Composition API, `<script setup>`) |
| [Vue Router](https://router.vuejs.org/) | client | Routes for the five tabs, deep links, route transitions |
| [Pinia](https://pinia.vuejs.org/) | client | Shared state stores for the user profile and bookshelf |
| [Bootstrap 5](https://getbootstrap.com/) | client | Reboot, grid and utility classes only (no Bootstrap JS/components) |
| [GSAP](https://gsap.com/) | client | All JavaScript animation: intro, `v-pop`, `v-wiggle`, `useReveal`, `usePressable`, tab bar |
| [Vite](https://vite.dev/) + [@vitejs/plugin-vue](https://github.com/vitejs/vite-plugin-vue) | client (dev) | Dev server, `.vue` compilation and production bundling |
| [Google Fonts](https://fonts.google.com/): Fredoka, DM Sans | client (`index.html` `<link>`) | Fredoka for headings, DM Sans for body text |
| [Express](https://expressjs.com/) | server | Minimal HTTP server; future thin proxy for public APIs |

Placeholder cover images use [Lorem Picsum](https://picsum.photos/) URLs in the mock data.
Each library is also credited in a comment where the code first uses it.

## Environment variables

**None are required for Phase 1.**

Later phases may add a `server/.env` (for example `PORT`, or API keys for proxied services).
`.env` files are git-ignored. If you add variables, commit an `.env.example` listing their names only.

| Variable | Where | Required | Default | Notes |
|----------|-------|----------|---------|-------|
| `PORT` | server | No | `3000` | Port the Express server listens on |

## Testing

E2E tests will be added in a later phase, together with instructions for running them.

## AI usage

See [`AI_USAGE.md`](AI_USAGE.md) for what was generated with AI assistance. Files scaffolded
with AI also carry a short comment at the top.
