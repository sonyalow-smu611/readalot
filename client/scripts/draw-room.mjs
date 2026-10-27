// Scaffolded with AI assistance — see AI_USAGE.md
// Draws every piece of My Room (client/public/room/strip/<id>.png) the same way the town is
// drawn (draw-town-map.mjs): plain browser code run in Playwright's Chromium, so every pixel comes
// out the same each run, with the town's own helpers (town-art/helpers.js), so the outlines match.
// Run it again after changing the art: `npm --workspace client run draw-room`.
//
// It also writes src/buildings/house/strip/sprites.json: each sprite's size and the points the
// room needs from it (where the glass is, where books stand, where a lamp glows).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))
const read = (path) => readFileSync(here(path), 'utf8')
const palette = read('../src/buildings/house/strip/palette.json')

const code = `(() => {\nconst PAL = ${palette}\n${read('./town-art/helpers.js')}\n${read('./room-art/room.js')}\n})()`

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const { sprites } = await page.evaluate(code)
  const dir = here('../public/room/strip/')
  mkdirSync(dir, { recursive: true })
  const index = {}
  for (const { id, w, h, meta, png } of sprites) {
    writeFileSync(`${dir}${id}.png`, Buffer.from(png.split(',')[1], 'base64'))
    index[id] = { w, h, ...meta }
  }
  writeFileSync(here('../src/buildings/house/strip/sprites.json'), JSON.stringify(index, null, 1) + '\n')
  console.log(`${sprites.length} room sprites saved to ${dir}`)
} finally {
  await browser.close()
}
