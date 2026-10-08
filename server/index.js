// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
// Express — minimal Node.js web server. Later phases use it as a thin proxy so
// third-party API calls (and any keys) stay on the server instead of the browser.
import express from 'express'
import booksRouter from './routes/books.js'
import weatherRouter from './routes/weather.js'
import timeRouter from './routes/time.js'
import creaturesRouter from './routes/creatures.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

// Proxy route groups. Each router is an empty placeholder in Phase 1.
app.use('/api/books', booksRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/time', timeRouter)
app.use('/api/creatures', creaturesRouter)

app.listen(PORT, () => {
  console.log(`Readalot server listening on http://localhost:${PORT}`)
})
