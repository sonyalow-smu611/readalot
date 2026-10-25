// Scaffolded with AI assistance — see AI_USAGE.md
// Draws the town (client/public/town/map.png) and the five avatars (client/public/town/avatars/).
// Run it again after changing the art: `npm --workspace client run draw-map`.
//
// The art lives in town-art/ as plain browser code: helpers.js, avatars.js, town.js run in that
// order inside one function, in Playwright's Chromium (already installed for the e2e tests), so
// every pixel comes out exactly the same each run. It prints the main buildings' boxes; copy them
// into src/town/places.js when a building moves.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const art = (name) => readFileSync(fileURLToPath(new URL(`./town-art/${name}`, import.meta.url)), 'utf8')
const out = (path) => fileURLToPath(new URL(`../public/town/${path}`, import.meta.url))
const save = (path, dataUrl) => writeFileSync(out(path), Buffer.from(dataUrl.split(',')[1], 'base64'))

const code = `(() => {\n${art('helpers.js')}\n${art('avatars.js')}\n${art('town.js')}\n})()`

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const result = await page.evaluate(code)
  mkdirSync(out('avatars'), { recursive: true })
  save('map.png', result.map)
  for (const avatar of result.avatars) save(`avatars/${avatar.id}.png`, avatar.png)
  console.log(`Town map ${result.mapSize.join(' x ')} saved to ${out('map.png')}`)
  console.log('Building boxes for src/town/places.js:', JSON.stringify(result.zones, null, 2))
} finally {
  await browser.close()
}
