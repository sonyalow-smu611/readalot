  // Drawing helpers shared by avatars.js and town.js. Everything is whole pixels, no smoothing.
  let seed = 23
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1))
  const mk = (w, h) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const x = c.getContext('2d')
    x.imageSmoothingEnabled = false
    return [c, x]
  }
  const R = (x, X, Y, W, H, col) => {
    x.fillStyle = col
    x.fillRect(Math.round(X), Math.round(Y), Math.round(W), Math.round(H))
  }
  const P = (x, X, Y, col) => R(x, X, Y, 1, 1, col)
  const E = (x, cx, cy, rx, ry, col) => {
    x.fillStyle = col
    cx = Math.round(cx)
    cy = Math.round(cy)
    for (let yy = -ry; yy <= ry; yy++) {
      const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / ((ry + 0.4) * (ry + 0.4)))))
      x.fillRect(cx - half, cy + yy, half * 2 + 1, 1)
    }
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16)
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))))
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
  }
  // crisp convex polygon: the left and right edge of each pixel row
  const span = (pts, y) => {
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[(i + 1) % pts.length]
      if ((y >= Math.min(y1, y2)) && (y <= Math.max(y1, y2)) && y1 !== y2) {
        const xx = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)
        lo = Math.min(lo, xx)
        hi = Math.max(hi, xx)
      } else if (y1 === y2 && y === y1) {
        lo = Math.min(lo, x1, x2)
        hi = Math.max(hi, x1, x2)
      }
    }
    return lo <= hi ? [Math.round(lo), Math.round(hi)] : null
  }
  const polyRows = (pts, fn) => {
    const ys = pts.map((p) => p[1])
    for (let y = Math.round(Math.min(...ys)); y <= Math.round(Math.max(...ys)); y++) {
      const s = span(pts, y + 0.5)
      if (s) fn(y, s[0], s[1])
    }
  }
  const fillPoly = (x, pts, col) => polyRows(pts, (y, a, b) => R(x, a, y, b - a, 1, col))
  const outline = (c, col = '#1e1a24') => {
    const [o, ox] = mk(c.width + 2, c.height + 2)
    ox.drawImage(c, 1, 1)
    const W = o.width
    const H = o.height
    const a = ox.getImageData(0, 0, W, H).data
    const solid = (i, j) => i >= 0 && j >= 0 && i < W && j < H && a[(j * W + i) * 4 + 3] > 100
    ox.fillStyle = col
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++)
        if (!solid(i, j) && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1))) ox.fillRect(i, j, 1, 1)
    return o
  }
  const sprite = (w, h, fn) => {
    const [c, x] = mk(w, h)
    fn(x)
    return outline(c)
  }
  const scaled = (c, k) => {
    const [o, ox] = mk(c.width * k, c.height * k)
    ox.drawImage(c, 0, 0, c.width * k, c.height * k)
    return o.toDataURL('image/png')
  }
