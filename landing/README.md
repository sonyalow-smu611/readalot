# IKDA landing page

A standalone page (plain HTML, CSS and JavaScript; no build step). Open `index.html` in a browser,
or serve the folder from any static host.

- "Try IKDA free" goes to `APP_URL` at the top of `main.js` (the app's sign-up page). Change it
  when the app is deployed.
- Pixel art comes from the app (`client/public/town/`); the screenshots are frames of the real
  app (from `video-ad/raw/`), with demo readers.
- Scenes fade in and out as you scroll, both ways, and the sky turns from morning to night. With
  "reduce motion" switched on, nothing fades or moves.
- "Make yourself" draws characters with the app's own code: `avatar.js` is
  `client/src/lib/avatar/draw.js` and `catalogue.js` bundled into one plain script (a page opened
  from a file can't load modules). Re-copy it if those files change. The visitor's look and name
  are remembered in their browser only.
