// Lift a pet out of a studio photo so it can stand on the floor.
// If the backdrop is not one flat colour, this returns '' and the drawing is used.

function at(px, w, x, y) {
  const i = (y * w + x) * 4
  return [px[i], px[i + 1], px[i + 2]]
}

function colorDist(r, g, b, bg) {
  const dr = r - bg[0]
  const dg = g - bg[1]
  const db = b - bg[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function edgeColor(px, w, h) {
  const points = []
  for (let x = 0; x < w; x += 4) {
    points.push(at(px, w, x, 1))
    points.push(at(px, w, x, h - 2))
  }
  for (let y = 0; y < h; y += 4) {
    points.push(at(px, w, 1, y))
    points.push(at(px, w, w - 2, y))
  }
  const seed = points[0]
  const close = points.filter((point) => colorDist(point[0], point[1], point[2], seed) < 42)
  if (close.length < points.length * 0.55) return null
  const count = close.length
  return [
    Math.round(close.reduce((sum, point) => sum + point[0], 0) / count),
    Math.round(close.reduce((sum, point) => sum + point[1], 0) / count),
    Math.round(close.reduce((sum, point) => sum + point[2], 0) / count),
  ]
}

function knockout(img) {
  const w = 220
  const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const image = ctx.getImageData(0, 0, w, h)
  const px = image.data
  const bg = edgeColor(px, w, h)
  if (!bg) return ''

  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  let kept = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4
      const dist = colorDist(px[i], px[i + 1], px[i + 2], bg)
      let alpha = 255
      if (dist < 36) alpha = 0
      else if (dist < 64) alpha = Math.round(((dist - 36) / 28) * 255)
      px[i + 3] = Math.min(px[i + 3], alpha)
      if (px[i + 3] > 48) {
        kept += 1
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return ''
  const coverage = kept / (w * h)
  if (coverage < 0.08 || coverage > 0.86) return ''

  const pad = 2
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(w - 1, maxX + pad)
  maxY = Math.min(h - 1, maxY + pad)
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  ctx.putImageData(image, 0, 0)
  const cropped = document.createElement('canvas')
  cropped.width = cw
  cropped.height = ch
  cropped.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch)
  return cropped.toDataURL('image/png')
}

export function cutout(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        resolve(knockout(img))
      } catch {
        resolve('')
      }
    }
    img.onerror = () => resolve('')
    img.src = url
  })
}
