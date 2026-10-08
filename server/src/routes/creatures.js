// Breed photos for the room pets. Wikipedia summaries name the cat breed and
// include a reference photo. Dog CEO returns a photo of the named breed.
// The browser asks this server, then lifts the pet off its photo background.
import { Router } from 'express'

const router = Router()

const CATS = [
  {
    id: 'cat-siamese',
    page: 'Siamese_cat',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Siamese_cat_Vaillante.JPG/330px-Siamese_cat_Vaillante.JPG',
  },
  {
    id: 'cat-maine',
    page: 'Maine_Coon',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/M%C3%A2le_Black_Silver_Blotched_Tabby.jpeg/330px-M%C3%A2le_Black_Silver_Blotched_Tabby.jpeg',
  },
  {
    id: 'cat-persian',
    page: 'Persian_cat',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Persialainen.jpg/330px-Persialainen.jpg',
  },
  {
    id: 'cat-bengal',
    page: 'Bengal_cat',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Paintedcats_Red_Star_standing.jpg/330px-Paintedcats_Red_Star_standing.jpg',
  },
  {
    id: 'cat-british',
    page: 'British_Shorthair',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Mystica_from_British_Empire_Cattery.jpg/330px-Mystica_from_British_Empire_Cattery.jpg',
  },
]

const DOGS = [
  { id: 'dog-husky', breed: 'husky', fallback: 'https://images.dog.ceo/breeds/husky/n02110185_10875.jpg' },
  { id: 'dog-corgi', breed: 'corgi', fallback: 'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_478.jpg' },
  { id: 'dog-pug', breed: 'pug', fallback: 'https://images.dog.ceo/breeds/pug/bruiser.jpg' },
  {
    id: 'dog-golden',
    breed: 'retriever/golden',
    fallback: 'https://images.dog.ceo/breeds/retriever-golden/pxl_20220424_121025943.mp.jpg',
  },
]

const HEADERS = { 'User-Agent': 'Readalot/1.0 (school project)' }
const urls = new Map()

async function wikiImage(page) {
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${page}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) return null
  const data = await response.json()
  return data?.thumbnail?.source || data?.originalimage?.source || null
}

async function dogImage(breed) {
  const response = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`, {
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) return null
  const data = await response.json()
  return data?.status === 'success' ? data.message : null
}

async function urlFor(id) {
  if (urls.has(id)) return urls.get(id)
  const cat = CATS.find((item) => item.id === id)
  const dog = DOGS.find((item) => item.id === id)
  let found = null
  try {
    if (cat) found = await wikiImage(cat.page)
    if (dog) found = await dogImage(dog.breed)
  } catch {
    found = null
  }
  const url = found || cat?.fallback || dog?.fallback || null
  if (url) urls.set(id, url)
  return url
}

router.get('/', (req, res) => {
  const images = {}
  ;[...CATS, ...DOGS].forEach((item) => {
    images[item.id] = `/api/creatures/img/${item.id}`
  })
  res.json({ images })
})

router.get('/img/:id', async (req, res) => {
  const url = await urlFor(req.params.id)
  if (!url) {
    res.status(404).end()
    return
  }
  try {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    if (!response.ok) {
      res.status(502).end()
      return
    }
    const type = response.headers.get('content-type') || 'image/jpeg'
    res.set('Content-Type', type)
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(Buffer.from(await response.arrayBuffer()))
  } catch {
    res.status(502).end()
  }
})

export default router
