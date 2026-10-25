  // ================================================================ the town, v3
  // A 56 x 40 tile map (32 px tiles) drawn at 1x, then doubled. Buildings are Stardew-style:
  // a front wall under a roof that faces you. Things that stand up are sorted by their base.
  const T = 32
  const MW = 56 * T
  const MH = 40 * T
  const [map, m] = mk(MW, MH)
  const things = []
  const place = (spr, X, baseY) => things.push({ spr, X: Math.round(X), Y: Math.round(baseY - spr.height + 1), base: baseY })
  const groundShadow = (X, Y, W, H) => R(m, X, Y, W, H, 'rgba(30,50,25,0.28)')

  // ---------------------------------------------------------------- ground
  R(m, 0, 0, MW, MH, '#6fb14b')
  for (let k = 0; k < 140; k++) E(m, ri(0, MW), ri(0, MH), ri(20, 70), ri(14, 44), rnd() < 0.5 ? '#68a845' : '#77b952')
  for (let k = 0; k < 16000; k++) P(m, ri(0, MW), ri(0, MH), rnd() < 0.5 ? '#62a242' : '#7dbd58')
  for (let k = 0; k < 900; k++) {
    const gx = ri(0, MW)
    const gy = ri(0, MH)
    P(m, gx, gy, '#4f8f3a')
    P(m, gx + 2, gy, '#4f8f3a')
    P(m, gx + 1, gy + 1, '#4f8f3a')
  }
  const flowerDot = (fx, fy, col) => {
    P(m, fx, fy, col)
    P(m, fx - 1, fy + 1, col)
    P(m, fx + 1, fy + 1, col)
    P(m, fx, fy + 2, col)
    P(m, fx, fy + 1, '#e3b04b')
  }
  for (let k = 0; k < 260; k++) flowerDot(ri(0, MW), ri(0, MH), ['#fdf7ec', '#f6e27a', '#f2a0b8', '#b9a8f0'][k % 4])

  // ---------------------------------------------------------------- water: a river into a lake
  const stamp = (pts, r, col, step = 4) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[i + 1]
      const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step)
      for (let k = 0; k <= n; k++) E(m, x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n, r, r, col)
    }
  }
  // smooth the river's corners
  const smooth = (pts) => {
    let out = pts
    for (let pass = 0; pass < 3; pass++) {
      const next = [out[0]]
      for (let i = 0; i < out.length - 1; i++) {
        const [ax, ay] = out[i]
        const [bx, by] = out[i + 1]
        next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75])
      }
      next.push(out[out.length - 1])
      out = next
    }
    return out
  }
  const river = smooth([[44, -2], [43, 5], [45, 10], [43, 15], [42.5, 21], [40.5, 27], [34, 31], [26, 33.2], [18, 34.5]].map(([a, b]) => [a * T, b * T]))
  const lake = { x: 11 * T, y: 35.6 * T, rx: 9 * T, ry: 4 * T }
  // beach first, then banks, then water
  E(m, lake.x, lake.y + 4, lake.rx + 40, lake.ry + 34, '#e8d39a')
  for (let k = 0; k < 900; k++) {
    const a = rnd() * Math.PI * 2
    const d = Math.sqrt(rnd())
    P(m, lake.x + Math.cos(a) * (lake.rx + 36) * d, lake.y + 4 + Math.sin(a) * (lake.ry + 30) * d, rnd() < 0.5 ? '#d9c184' : '#f2e2b0')
  }
  stamp(river, 58, '#4f8f3a')
  stamp(river, 52, '#d9c184')
  E(m, lake.x, lake.y, lake.rx, lake.ry, '#3f8fbf')
  stamp(river, 46, '#3f8fbf')
  E(m, lake.x, lake.y, lake.rx - 12, lake.ry - 10, '#4f9fc9')
  stamp(river, 38, '#4f9fc9')
  E(m, lake.x + 20, lake.y + 6, lake.rx - 70, lake.ry - 46, '#3f8fbf')
  for (let k = 0; k < 260; k++) {
    const i = ri(0, river.length - 2)
    const [rx0, ry0] = river[i]
    R(m, rx0 + ri(-28, 20), ry0 + ri(-30, 30), ri(4, 9), 1, '#9fd4ee')
  }
  for (let k = 0; k < 80; k++) R(m, lake.x + ri(-lake.rx + 40, lake.rx - 40), lake.y + ri(-lake.ry + 30, lake.ry - 30), ri(4, 10), 1, '#9fd4ee')

  // ---------------------------------------------------------------- roads
  // x/y/w/h in tiles; asphalt with a pale kerb and a pavement strip on each side
  const ROADS = [
    { x: 0, y: 18, w: 56, h: 2, dir: 'h' },
    { x: 22, y: 0, w: 2, h: 18, dir: 'v' },
    { x: 30, y: 20, w: 2, h: 20, dir: 'v' },
    { x: 0, y: 28, w: 30, h: 2, dir: 'h' },
    { x: 52, y: 20, w: 2, h: 10, dir: 'v' },
    { x: 44, y: 30, w: 12, h: 2, dir: 'h' },
  ]
  const WALK = 12
  for (const r of ROADS) R(m, r.x * T - WALK, r.y * T - WALK, r.w * T + WALK * 2, r.h * T + WALK * 2, '#cfc6b4')
  for (const r of ROADS) {
    // pavement slabs
    const X = r.x * T - WALK
    const Y = r.y * T - WALK
    for (let i = 0; i < (r.dir === 'h' ? r.w * T + WALK * 2 : r.h * T + WALK * 2); i += 16) {
      if (r.dir === 'h') {
        R(m, X + i, Y, 1, WALK, '#b9b09d')
        R(m, X + i, r.y * T + r.h * T, 1, WALK, '#b9b09d')
      } else {
        R(m, X, Y + i, WALK, 1, '#b9b09d')
        R(m, r.x * T + r.w * T, Y + i, WALK, 1, '#b9b09d')
      }
    }
  }
  for (const r of ROADS) {
    R(m, r.x * T, r.y * T, r.w * T, r.h * T, '#5d5f6c')
    for (let k = 0; k < (r.w * r.h * 30); k++) P(m, r.x * T + ri(0, r.w * T - 1), r.y * T + ri(0, r.h * T - 1), rnd() < 0.5 ? '#565865' : '#666876')
  }
  const inJunction = (px, py) =>
    ROADS.filter((r) => px >= r.x * T - 4 && px <= (r.x + r.w) * T + 4 && py >= r.y * T - 4 && py <= (r.y + r.h) * T + 4).length > 1
  for (const r of ROADS) {
    if (r.dir === 'h') {
      const cy = r.y * T + T - 1
      for (let px = r.x * T + 6; px < (r.x + r.w) * T - 20; px += 40) if (!inJunction(px + 10, cy) && !inJunction(px, cy)) R(m, px, cy, 20, 3, '#efe2bf')
    } else {
      const cx = r.x * T + T - 1
      for (let py = r.y * T + 6; py < (r.y + r.h) * T - 20; py += 40) if (!inJunction(cx, py + 10) && !inJunction(cx, py)) R(m, cx, py, 3, 20, '#efe2bf')
    }
  }
  const zebraV = (X, Y, W, H) => {
    for (let i = 4; i + 6 <= W - 2; i += 11) R(m, X + i, Y, 6, H, '#f4efe2')
  }
  const zebraH = (X, Y, W, H) => {
    for (let i = 4; i + 6 <= H - 2; i += 11) R(m, X, Y + i, W, 6, '#f4efe2')
  }
  zebraV(22 * T, 17 * T - 30, 2 * T, 22)
  zebraV(30 * T, 20 * T + 8, 2 * T, 22)
  zebraH(21 * T - 28, 18 * T, 22, 2 * T)
  zebraH(24 * T + 6, 18 * T, 22, 2 * T)
  zebraV(52 * T, 20 * T + 8, 2 * T, 22)

  // bridges where the main road and the south road cross the river
  const roadBridge = (X1, X2, Y, H, horizontal) => {
    if (horizontal) {
      R(m, X1, Y - WALK, X2 - X1, H + WALK * 2, '#cfc6b4')
      R(m, X1, Y, X2 - X1, H, '#5d5f6c')
      for (let px = X1 + 6; px < X2 - 20; px += 40) R(m, px, Y + H / 2 - 1, 20, 3, '#efe2bf')
      const rail = sprite(X2 - X1 + 8, 14, (x) => {
        R(x, 0, 4, X2 - X1 + 8, 6, '#c9c0ad')
        R(x, 0, 4, X2 - X1 + 8, 2, '#e6dfcf')
        for (let px = 0; px < X2 - X1 + 8; px += 18) R(x, px, 0, 6, 14, '#b0a792')
      })
      place(rail, X1 - 4, Y - WALK + 2)
      place(rail, X1 - 4, Y + H + WALK + 2)
    } else {
      R(m, X1 - WALK, Y, X2 - X1 + WALK * 2, H, '#cfc6b4')
      R(m, X1, Y, X2 - X1, H, '#5d5f6c')
      for (let py = Y + 6; py < Y + H - 20; py += 40) R(m, X1 + (X2 - X1) / 2 - 1, py, 3, 20, '#efe2bf')
      for (const rx of [X1 - WALK - 6, X2 + WALK]) {
        const rail = sprite(8, H + 10, (x) => {
          R(x, 1, 0, 6, H + 10, '#c9c0ad')
          R(x, 1, 0, 2, H + 10, '#e6dfcf')
          for (let py = 0; py < H + 10; py += 18) R(x, 0, py, 8, 6, '#b0a792')
        })
        place(rail, rx, Y + H + 4)
      }
    }
  }
  roadBridge(40 * T, 46 * T, 18 * T, 2 * T, true)
  roadBridge(30 * T, 32 * T, 30.6 * T, 3.6 * T, false)

  // dirt trails
  const trail = (pts, w = 14) => {
    stamp(pts.map(([a, b]) => [a * T, b * T]), w, '#b8925a', 6)
    stamp(pts.map(([a, b]) => [a * T, b * T]), w - 3, '#c9a46a', 6)
    for (let k = 0; k < pts.length * 30; k++) {
      const i = ri(0, pts.length - 2)
      const t = rnd()
      P(m, (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t) * T + ri(-8, 8), (pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t) * T + ri(-8, 8), '#a8844e')
    }
  }
  trail([[22, 7], [15, 7], [9, 6.5], [6, 6.8]])
  trail([[24, 6.5], [30, 6.5], [38, 6.8], [48, 6.8], [50, 8.6]])
  trail([[12, 30.4], [12.5, 31.6]])
  trail([[32, 35], [38, 35.5], [46, 35], [52, 36]])

  // wooden footbridge on the east trail
  const footbridge = sprite(7 * T, 40, (x) => {
    R(x, 0, 8, 7 * T, 26, '#a8683f')
    for (let px = 0; px < 7 * T; px += 8) R(x, px, 8, 1, 26, '#7a4a2a')
    R(x, 0, 2, 7 * T, 4, '#8a5432')
    R(x, 0, 34, 7 * T, 4, '#8a5432')
    for (let px = 0; px < 7 * T; px += 24) {
      R(x, px, 0, 4, 8, '#6b4226')
      R(x, px, 32, 4, 8, '#6b4226')
    }
  })
  place(footbridge, 40.5 * T, 7.4 * T + 6)

  // dock into the lake
  const dock = sprite(36, 120, (x) => {
    R(x, 0, 0, 36, 120, '#a8683f')
    for (let py = 0; py < 120; py += 8) R(x, 0, py, 36, 1, '#7a4a2a')
    R(x, 0, 0, 3, 120, '#8a5432')
    R(x, 33, 0, 3, 120, '#8a5432')
  })
  things.push({ spr: dock, X: 12 * T - 18, Y: 31.6 * T, base: 31.6 * T + 1 })

  // ---------------------------------------------------------------- plaza with fountain
  const plaza = { x: 25 * T, y: 9 * T, w: 9 * T, h: 8 * T }
  R(m, plaza.x, plaza.y, plaza.w, plaza.h, '#cbbd9f')
  for (let py = 0; py < plaza.h; py += 16)
    for (let px = 0; px < plaza.w; px += 16) R(m, plaza.x + px + 1, plaza.y + py + 1, 14, 14, (px + py) % 32 ? '#ddd0b4' : '#d6c8aa')
  E(m, plaza.x + plaza.w / 2, plaza.y + plaza.h / 2 + 8, 70, 48, '#b9ab8d')
  E(m, plaza.x + plaza.w / 2, plaza.y + plaza.h / 2 + 8, 66, 44, '#e6dccb')
  for (const [cx, cy] of [[plaza.x + 20, plaza.y + 20], [plaza.x + plaza.w - 20, plaza.y + 20]]) {
    E(m, cx, cy, 14, 10, '#4f8f3a')
    E(m, cx - 2, cy - 2, 9, 6, '#6fb24f')
  }

  // ---------------------------------------------------------------- props
  function tree(cx, baseY, r = 20, kind = 'round') {
    if (kind === 'pine') {
      const h = r * 3
      const s = sprite(r * 2 + 2, h + 10, (x) => {
        R(x, r - 2, h - 4, 6, 14, '#6b4226')
        for (let k = 0; k < 4; k++) {
          const ty = k * (h / 5)
          const half = Math.round(r * (0.45 + k * 0.18))
          fillPoly(x, [[r + 1, ty], [r + 1 + half, ty + h / 3], [r + 1 - half, ty + h / 3]], k % 2 ? '#2f6b34' : '#3f8a43')
          fillPoly(x, [[r + 1, ty + 4], [r + 1 - half + 4, ty + h / 3 - 2], [r - 2, ty + h / 3 - 2]], '#56a659')
        }
      })
      E(m, cx + 4, baseY, r - 4, 4, 'rgba(30,50,25,0.4)')
      place(s, cx - r - 1, baseY)
      return
    }
    const s = sprite(r * 2 + 6, r * 2 + 18, (x) => {
      R(x, r, r * 2 - 4, 7, 20, '#6b4226')
      R(x, r + 5, r * 2 - 4, 2, 20, '#4a2a14')
      E(x, r + 3, r + 1, r + 1, r - 1, '#2f6b30')
      E(x, r + 2, r - 1, r - 1, r - 3, '#3f7d3a')
      E(x, r, r - 4, r - 5, r - 7, '#5aa045')
      E(x, r - 5, r - 9, Math.max(2, Math.round(r / 3)), Math.max(2, Math.round(r / 4)), '#86c463')
      for (let k = 0; k < r * 1.5; k++) P(x, ri(6, r * 2 - 2), ri(5, r * 2 - 6), rnd() < 0.5 ? '#4f8f3a' : '#6fb24f')
      if (kind === 'fruit') for (let k = 0; k < 6; k++) R(x, ri(8, r * 2 - 6), ri(8, r * 2 - 8), 2, 2, '#d0453d')
    })
    E(m, cx + 4, baseY, r, 6, 'rgba(30,50,25,0.4)')
    place(s, cx - r - 3, baseY)
  }

  function bush(cx, baseY, flower) {
    const s = sprite(24, 16, (x) => {
      E(x, 12, 9, 11, 6, '#3f7d3a')
      E(x, 10, 7, 7, 4, '#5aa045')
      if (flower) for (const [fx, fy] of [[5, 7], [12, 4], [17, 9], [9, 11], [19, 6]]) P(x, fx, fy, flower)
    })
    place(s, cx - 12, baseY)
  }

  function lamp(cx, baseY) {
    const s = sprite(10, 50, (x) => {
      R(x, 4, 10, 2, 38, '#3a3a48')
      R(x, 2, 46, 6, 4, '#3a3a48')
      R(x, 1, 3, 8, 7, '#ffe08a')
      R(x, 0, 0, 10, 3, '#3a3a48')
      R(x, 2, 4, 2, 2, '#fffbe0')
    })
    place(s, cx - 5, baseY)
  }

  function phoneBooth(cx, baseY) {
    const s = sprite(22, 52, (x) => {
      R(x, 0, 4, 22, 48, '#c0392f')
      R(x, 0, 0, 22, 6, '#8e2a22')
      R(x, 4, 8, 14, 4, '#1e1a24')
      R(x, 6, 9, 10, 2, '#f4efe2')
      R(x, 3, 14, 16, 30, '#9fd4ee')
      for (let yy = 14; yy < 44; yy += 7) R(x, 3, yy, 16, 1, '#8e2a22')
      R(x, 10, 14, 2, 30, '#8e2a22')
      R(x, 18, 4, 4, 48, '#8e2a22')
    })
    place(s, cx - 11, baseY)
  }

  function bench(cx, baseY, vertical) {
    const s = vertical
      ? sprite(18, 38, (x) => {
          R(x, 0, 0, 6, 34, '#a8683f')
          R(x, 8, 0, 8, 34, '#c08050')
          R(x, 2, 34, 3, 4, '#5a3a24')
          R(x, 12, 34, 3, 4, '#5a3a24')
        })
      : sprite(36, 18, (x) => {
          R(x, 0, 0, 36, 6, '#a8683f')
          R(x, 0, 8, 36, 5, '#c08050')
          R(x, 0, 12, 36, 1, '#7a4a2a')
          R(x, 2, 13, 3, 5, '#5a3a24')
          R(x, 31, 13, 3, 5, '#5a3a24')
        })
    place(s, cx - s.width / 2, baseY)
  }

  function busStop(cx, baseY) {
    const s = sprite(70, 54, (x) => {
      R(x, 0, 0, 70, 8, '#3d6fd0')
      R(x, 0, 6, 70, 2, '#2a4f9a')
      R(x, 2, 8, 3, 44, '#5a5a68')
      R(x, 65, 8, 3, 44, '#5a5a68')
      R(x, 5, 10, 60, 30, 'rgba(159,212,238,0.55)')
      R(x, 8, 38, 54, 6, '#a8683f')
      R(x, 40, 14, 18, 12, '#f4efe2')
      R(x, 42, 16, 14, 2, '#3d6fd0')
    })
    place(s, cx - 35, baseY)
  }

  function fountain(cx, baseY) {
    const s = sprite(96, 64, (x) => {
      E(x, 48, 44, 46, 16, '#a9a092')
      E(x, 48, 42, 46, 15, '#c9c0ad')
      E(x, 48, 42, 39, 12, '#3f8fbf')
      E(x, 48, 41, 32, 9, '#5fb4d9')
      R(x, 43, 16, 10, 26, '#c9c0ad')
      R(x, 50, 16, 3, 26, '#a9a092')
      E(x, 48, 16, 14, 5, '#c9c0ad')
      E(x, 48, 15, 10, 3, '#5fb4d9')
      R(x, 47, 0, 2, 14, '#bfe6f5')
      for (const [px, py] of [[41, 5], [55, 5], [38, 10], [58, 10], [36, 15], [60, 15]]) P(x, px, py, '#bfe6f5')
      R(x, 26, 40, 5, 1, '#e8f7fc')
      R(x, 62, 43, 6, 1, '#e8f7fc')
    })
    place(s, cx - 48, baseY)
  }

  function umbrellaTable(cx, baseY, a, b) {
    const s = sprite(42, 48, (x) => {
      E(x, 21, 42, 13, 4, '#e8d9bf')
      R(x, 20, 10, 2, 32, '#5b4636')
      for (let i = 0; i < 42; i++) {
        const w = Math.max(0, 21 - Math.abs(i - 21))
        const top = Math.round(11 - w / 2.4)
        R(x, i, top, 1, 15 - top, Math.floor(i / 6) % 2 ? a : b)
      }
      R(x, 0, 14, 42, 1, shade(a, 0.7))
      R(x, 4, 42, 5, 5, '#a8683f')
      R(x, 33, 42, 5, 5, '#a8683f')
    })
    place(s, cx - 21, baseY)
  }

  function fenceRun(x1, x2, baseY, col = '#f4efe2') {
    const w = x2 - x1
    const s = sprite(w, 18, (x) => {
      R(x, 0, 5, w, 3, col)
      R(x, 0, 11, w, 3, col)
      for (let px = 0; px < w; px += 10) {
        R(x, px, 0, 5, 18, col)
        R(x, px + 4, 0, 1, 18, shade(col, 0.8))
      }
    })
    place(s, x1, baseY)
  }

  function car(X, baseY, col, vertical) {
    const s = vertical
      ? sprite(30, 54, (x) => {
          R(x, 0, 4, 30, 48, col)
          R(x, 3, 12, 24, 12, '#3d4a5a')
          R(x, 3, 34, 24, 8, '#3d4a5a')
          R(x, 4, 24, 22, 10, shade(col, 1.15))
          R(x, 3, 0, 6, 4, '#ffe08a')
          R(x, 21, 0, 6, 4, '#ffe08a')
          R(x, 3, 52, 6, 2, '#d0453d')
          R(x, 21, 52, 6, 2, '#d0453d')
        })
      : sprite(56, 30, (x) => {
          R(x, 2, 0, 52, 30, col)
          R(x, 10, 3, 12, 24, '#3d4a5a')
          R(x, 36, 3, 8, 24, '#3d4a5a')
          R(x, 22, 4, 14, 22, shade(col, 1.15))
          R(x, 54, 3, 2, 6, '#ffe08a')
          R(x, 54, 21, 2, 6, '#ffe08a')
          R(x, 0, 3, 2, 6, '#d0453d')
          R(x, 0, 21, 2, 6, '#d0453d')
        })
    place(s, X, baseY)
  }

  // ---------------------------------------------------------------- buildings, Stardew style
  const window2 = (x, X, Y, w, h, o = {}) => {
    const frame = o.frame ?? '#f4efe2'
    if (o.shutters) {
      R(x, X - 7, Y, 6, h, o.shutters)
      R(x, X + w + 1, Y, 6, h, o.shutters)
      for (let yy = Y + 2; yy < Y + h; yy += 4) {
        R(x, X - 6, yy, 4, 1, shade(o.shutters, 0.75))
        R(x, X + w + 2, yy, 4, 1, shade(o.shutters, 0.75))
      }
    }
    R(x, X, Y, w, h, frame)
    const glass = o.glass ?? '#7fb6d9'
    if (o.arch) {
      E(x, X + w / 2, Y, w / 2, w / 2, frame)
      E(x, X + w / 2, Y + 2, w / 2 - 3, w / 2 - 3, glass)
    }
    R(x, X + 3, Y + 3, w - 6, h - 6, glass)
    R(x, X + 3, Y + 3, 3, h - 6, shade(glass, 1.18))
    R(x, X + w / 2 - 1, Y + 2, 2, h - 4, frame)
    R(x, X + 2, Y + h / 2 - 1, w - 4, 2, frame)
    if (o.box) {
      R(x, X - 2, Y + h, w + 4, 6, o.box)
      for (let k = 0; k < 5; k++) P(x, X + 2 + k * (w / 5), Y + h + 1, ['#f2a0b8', '#f6e27a', '#fdf7ec'][k % 3])
    } else R(x, X - 2, Y + h, w + 4, 3, shade(frame, 0.85))
  }
  const door2 = (x, X, Y, w, h, col, o = {}) => {
    R(x, X - 3, Y - 3, w + 6, h + 3, o.frame ?? '#f4efe2')
    R(x, X, Y, w, h, col)
    if (o.double) R(x, X + w / 2 - 1, Y, 2, h, shade(col, 0.6))
    R(x, X + 3, Y + 4, (o.double ? w / 2 : w) - 7, h / 2 - 6, shade(col, 0.82))
    R(x, X + 3, Y + h / 2 + 2, (o.double ? w / 2 : w) - 7, h / 2 - 6, shade(col, 0.82))
    if (o.glass) R(x, X + 5, Y + 6, w - 10, 10, '#9fd4ee')
    R(x, X + w - 6, Y + h / 2, 2, 3, '#e3b04b')
    R(x, X - 5, Y + h, w + 10, 4, '#b9b09d')
  }
  const wallTexture = (x, X, Y, w, h, kind, col) => {
    if (kind === 'siding') for (let yy = Y + 5; yy < Y + h; yy += 6) R(x, X, yy, w, 1, shade(col, 0.85))
    if (kind === 'plank') for (let xx = X + 6; xx < X + w; xx += 8) R(x, xx, Y, 1, h, shade(col, 0.82))
    if (kind === 'brick')
      for (let yy = Y + 2; yy < Y + h; yy += 6) {
        R(x, X, yy + 4, w, 1, shade(col, 0.8))
        for (let xx = X + ((yy / 6) % 2 ? 0 : 7); xx < X + w; xx += 14) R(x, xx, yy, 1, 5, shade(col, 0.8))
      }
    if (kind === 'stone')
      for (let yy = Y + 2; yy < Y + h; yy += 10) {
        R(x, X, yy + 8, w, 1, shade(col, 0.82))
        for (let xx = X + ((yy / 10) % 2 ? 4 : 14); xx < X + w; xx += 20) R(x, xx, yy, 1, 9, shade(col, 0.82))
      }
  }
  // shingles that follow the roof's shape, row by row
  const shingles = (x, pts, col, o = {}) => {
    const rowH = o.rowH ?? 6
    const ys = pts.map((p) => p[1])
    const top = Math.round(Math.min(...ys))
    polyRows(pts, (y, a, b) => {
      const row = Math.floor((y - top) / rowH)
      const inRow = (y - top) % rowH
      const base = row % 2 ? col : shade(col, 1.06)
      R(x, a, y, b - a, 1, inRow === rowH - 1 ? shade(col, 0.68) : inRow === 0 ? shade(col, 1.18) : base)
      if (inRow !== rowH - 1) for (let xx = a + ((row * 7) % 12); xx < b; xx += 12) P(x, xx, y, shade(col, 0.72))
    })
  }

  // one building: a front wall with a roof above it. Returns the door's spot for labels.
  function building(o) {
    const ov = o.overhang ?? 10
    const roofH = o.roofH
    const pad = 20
    const W = o.w + ov * 2 + pad * 2
    const H = o.wallH + roofH + (o.above ?? 30) + (o.porch ? 18 : 6)
    const s = sprite(W, H, (x) => {
      const L = ov + pad
      const eave = (o.above ?? 30) + roofH
      const cx = L + o.w / 2
      // chimney sits behind the roof
      if (o.chimney) {
        const chx = L + o.w * o.chimney
        R(x, chx, eave - roofH - 16, 16, roofH, '#9a5a44')
        wallTexture(x, chx, eave - roofH - 16, 16, roofH, 'brick', '#9a5a44')
        R(x, chx - 2, eave - roofH - 20, 20, 5, '#6b3a2a')
      }
      // wall
      R(x, L, eave, o.w, o.wallH, o.wall)
      wallTexture(x, L, eave, o.w, o.wallH, o.texture, o.wall)
      R(x, L, eave + o.wallH - 8, o.w, 8, o.base ?? '#8a8478')
      wallTexture(x, L, eave + o.wallH - 8, o.w, 8, 'stone', o.base ?? '#8a8478')
      R(x, L, eave, 4, o.wallH - 8, o.trim ?? shade(o.wall, 0.8))
      R(x, L + o.w - 4, eave, 4, o.wallH - 8, o.trim ?? shade(o.wall, 0.8))
      R(x, L, eave, o.w, 4, shade(o.wall, 0.7))
      // roof
      let roof
      if (o.roof === 'gable') roof = [[L - ov, eave + 4], [L + o.w + ov, eave + 4], [cx, eave - roofH]]
      else if (o.roof === 'gambrel')
        roof = [[L - ov, eave + 4], [L - ov + 10, eave - roofH * 0.55], [L + o.w * 0.28, eave - roofH], [L + o.w * 0.72, eave - roofH], [L + o.w + ov - 10, eave - roofH * 0.55], [L + o.w + ov, eave + 4]]
      else roof = [[L - ov, eave + 4], [L + o.w + ov, eave + 4], [L + o.w + ov - roofH * 0.45, eave - roofH], [L - ov + roofH * 0.45, eave - roofH]]
      shingles(x, roof, o.roofC)
      R(x, L - ov, eave + 2, o.w + ov * 2, 4, shade(o.roofC, 0.55))
      if (o.roof === 'gable') {
        // the front gable wall shows inside the roof
        const gable = [[L + 14, eave + 2], [L + o.w - 14, eave + 2], [cx, eave - roofH + 26]]
        fillPoly(x, gable, o.gableC ?? o.wall)
        if (o.texture === 'siding') polyRows(gable, (y, a, b) => (y % 6 === 0 ? R(x, a, y, b - a, 1, shade(o.gableC ?? o.wall, 0.85)) : null))
        if (o.roundWindow) {
          const wy = eave - roofH * 0.38
          E(x, cx, wy, 9, 9, '#f4efe2')
          E(x, cx, wy, 6, 6, '#7fb6d9')
          R(x, cx - 1, wy - 6, 2, 12, '#f4efe2')
          R(x, cx - 6, wy - 1, 12, 2, '#f4efe2')
        }
      } else {
        R(x, roof[3][0], eave - roofH - 2, roof[2][0] - roof[3][0], 4, shade(o.roofC, 0.75))
      }
      o.decor?.(x, L, eave, cx)
      if (o.porch) {
        const py = eave + o.wallH
        R(x, L - 8, py - 2, o.w + 16, 14, '#a8683f')
        for (let xx = L - 8; xx < L + o.w + 8; xx += 9) R(x, xx, py - 2, 1, 14, '#7a4a2a')
        R(x, L - 8, py + 10, o.w + 16, 3, '#6b4226')
        R(x, L - 8, py - 46, 5, 44, '#f4efe2')
        R(x, L + o.w + 3, py - 46, 5, 44, '#f4efe2')
      }
    })
    const X = o.x - (o.overhang ?? 10) - pad
    groundShadow(o.x + o.w + 4, o.base_y - o.wallH * 0.6, 14, o.wallH * 0.6)
    place(s, X, o.base_y + (o.porch ? 12 : 0))
    return { left: o.x - ov, right: o.x + o.w + ov, top: o.base_y - o.wallH - o.roofH - (o.above ?? 30), bottom: o.base_y + (o.porch ? 12 : 0) }
  }

  // ---------------------------------------------------------------- the four places
  const ROW1 = 18 * T - WALK - 2
  const ROW2 = 28 * T - WALK - 2
  const ROW3 = 30 * T - WALK - 2
  // each main building's box, for its tap zone in the app
  const zones = {}

  // Library: stone, slate roof, clock gable and arched windows
  {
    const b = building({
      x: 8 * T, base_y: ROW1, w: 8 * T, wallH: 112, roofH: 92, roof: 'hip', roofC: '#4d6a8a', wall: '#d8c9a8', texture: 'stone', trim: '#b9a57e', base: '#8a8478', above: 54,
      decor: (x, L, eave, cx) => {
        // central gable with a clock
        const g = [[cx - 64, eave + 4], [cx + 64, eave + 4], [cx, eave - 92 - 40]]
        shingles(x, g, '#405a78')
        fillPoly(x, [[cx - 50, eave + 2], [cx + 50, eave + 2], [cx, eave - 92 - 14]], '#e6d9bb')
        E(x, cx, eave - 50, 16, 16, '#f4efe2')
        E(x, cx, eave - 50, 13, 13, '#fdf7ec')
        R(x, cx - 1, eave - 60, 2, 11, '#2b2230')
        R(x, cx, eave - 51, 8, 2, '#2b2230')
        E(x, cx, eave - 50, 2, 2, '#c0392f')
        for (const wx of [L + 18, L + 58, L + 172, L + 212]) window2(x, wx, eave + 30, 26, 46, { arch: true, frame: '#f4efe2', glass: '#6fa8cc' })
        R(x, cx - 46, eave + 10, 92, 14, '#5a3a24')
        R(x, cx - 42, eave + 13, 84, 8, '#f4efe2')
        for (let i = 0; i < 9; i++) R(x, cx - 38 + i * 9, eave + 15, 5, 4, ['#9c6644', '#3f8c86', '#c0563f'][i % 3])
        door2(x, cx - 22, eave + 112 - 8 - 56, 44, 56, '#5a3a24', { double: true, frame: '#e6d9bb' })
        for (const px of [cx - 40, cx + 32]) R(x, px, eave + 30, 8, 74, '#efe4cc')
      },
    })
    zones.library = b
  }

  // Cafe: brick with a striped awning, a chalkboard and tables outside
  {
    const b = building({
      x: 34.6 * T, base_y: ROW1, w: 5.6 * T, wallH: 92, roofH: 64, roof: 'hip', roofC: '#b8573f', wall: '#c98a6a', texture: 'brick', trim: '#9c6644', chimney: 0.78,
      decor: (x, L, eave, cx) => {
        const w = 5.6 * T
        window2(x, L + 12, eave + 34, 46, 40, { glass: '#ffd98a' })
        window2(x, L + w - 58, eave + 34, 46, 40, { glass: '#ffd98a' })
        door2(x, cx - 15, eave + 92 - 8 - 50, 30, 50, '#3f6b5a', { glass: true })
        for (let i = 0; i < w + 16; i += 14) {
          R(x, L - 8 + i, eave + 10, 14, 14, (i / 14) % 2 ? '#fdf7ec' : '#3f8c6a')
          R(x, L - 8 + i, eave + 24, 14, 3, (i / 14) % 2 ? '#d9d0c4' : '#2a6a4a')
        }
        R(x, cx - 32, eave - 18, 64, 18, '#3a2a20')
        R(x, cx - 28, eave - 14, 56, 10, '#f4efe2')
        R(x, cx - 20, eave - 12, 10, 6, '#7a4a2a')
        R(x, cx - 10, eave - 11, 3, 3, '#7a4a2a')
        for (let i = 0; i < 4; i++) R(x, cx + 2 + i * 6, eave - 11, 4, 4, '#c0563f')
      },
    })
    zones.cafe = b
  }
  umbrellaTable(33.8 * T, ROW1 - 6, '#3f8c6a', '#fdf7ec')
  umbrellaTable(31.6 * T, ROW1 - 8, '#c0563f', '#fdf7ec')
  // chalkboard
  place(sprite(16, 22, (x) => {
    R(x, 0, 0, 16, 16, '#2b2b33')
    R(x, 2, 3, 10, 1, '#f4efe2')
    R(x, 2, 7, 8, 1, '#f6e27a')
    R(x, 2, 11, 11, 1, '#f4efe2')
    R(x, 1, 16, 2, 6, '#7a4a2a')
    R(x, 13, 16, 2, 6, '#7a4a2a')
  }), 40.4 * T - 14, ROW1 + 4)

  // Your house: white siding, blue roof, porch, like a Stardew farmhouse
  {
    const b = building({
      x: 7.2 * T, base_y: ROW2 - 12, w: 6.4 * T, wallH: 86, roofH: 74, roof: 'hip', roofC: '#4a7fb0', wall: '#eef0ec', texture: 'siding', trim: '#9fb8cc', chimney: 0.18, porch: true,
      decor: (x, L, eave, cx) => {
        const w = 6.4 * T
        window2(x, L + 22, eave + 22, 34, 32, { shutters: '#4a7fb0', box: '#8a5432' })
        window2(x, L + w - 56, eave + 22, 34, 32, { shutters: '#4a7fb0', box: '#8a5432' })
        door2(x, cx - 15, eave + 86 - 8 - 52, 30, 52, '#4a7fb0', { glass: true })
        E(x, cx, eave - 30, 8, 8, '#f4efe2')
        E(x, cx, eave - 30, 5, 5, '#7fb6d9')
      },
    })
    zones.house = b
  }
  // mailbox and garden
  place(sprite(12, 30, (x) => {
    R(x, 5, 10, 2, 20, '#6b4226')
    R(x, 0, 0, 12, 10, '#4a7fb0')
    R(x, 0, 0, 12, 3, '#6a9fd0')
    R(x, 11, 2, 1, 5, '#d0453d')
  }), 14.4 * T, ROW2 + 4)
  fenceRun(5.2 * T, 6.8 * T, ROW2 + 2)

  // Hair salon: a gable front with a round window, double doors, barber pole
  {
    const b = building({
      x: 44.6 * T, base_y: ROW3, w: 5.6 * T, wallH: 90, roofH: 96, roof: 'gable', roofC: '#3a3a46', wall: '#e8e2da', gableC: '#d9d2ca', texture: 'siding', trim: '#c9a0b4', roundWindow: true,
      decor: (x, L, eave, cx) => {
        const w = 5.6 * T
        door2(x, cx - 24, eave + 90 - 8 - 54, 48, 54, '#4a7fa8', { double: true })
        window2(x, L + 12, eave + 28, 34, 34, { glass: '#f2c4d6', frame: '#f4efe2', box: '#c98aa8' })
        window2(x, L + w - 46, eave + 28, 34, 34, { glass: '#f2c4d6', frame: '#f4efe2', box: '#c98aa8' })
        R(x, cx - 40, eave + 8, 80, 14, '#c98aa8')
        R(x, cx - 36, eave + 11, 72, 8, '#fdf7ec')
        E(x, cx - 8, eave + 15, 2, 2, '#9a3f62')
        E(x, cx + 6, eave + 15, 2, 2, '#9a3f62')
        R(x, cx - 6, eave + 13, 10, 1, '#9a3f62')
        // little cherry blossoms on the roof, like the reference
        for (const [px, py] of [[cx - 50, eave - 40], [cx + 38, eave - 24], [cx - 20, eave - 70], [cx + 18, eave - 60]]) {
          R(x, px, py, 3, 3, '#e6a6d0')
          P(x, px + 1, py + 1, '#fdf7ec')
        }
      },
    })
    zones.salon = b
  }
  place(sprite(10, 40, (x) => {
    R(x, 0, 0, 10, 5, '#5a5a68')
    R(x, 1, 5, 8, 30, '#fdf7ec')
    for (let k = 0; k < 7; k++) R(x, 1, 7 + k * 4, 8, 2, k % 2 ? '#3d6fd0' : '#d0453d')
    R(x, 0, 35, 10, 5, '#5a5a68')
  }), 50.4 * T, ROW3 + 2)

  // ---------------------------------------------------------------- filler buildings
  const filler = (o) => building({ above: 26, ...o })
  filler({ x: 1 * T, base_y: ROW1, w: 4.2 * T, wallH: 70, roofH: 56, roof: 'gable', roofC: '#4a7fb0', wall: '#8a8f99', texture: 'plank', roundWindow: true,
    decor: (x, L, eave, cx) => { window2(x, L + 12, eave + 18, 26, 26, { frame: '#e6f0e6', shutters: '#5fb59b' }); door2(x, L + 4.2 * T - 46, eave + 70 - 8 - 44, 26, 44, '#5a8ab0') } })
  filler({ x: 49 * T, base_y: ROW1, w: 4 * T, wallH: 66, roofH: 50, roof: 'hip', roofC: '#5a8a4a', wall: '#f0e2c4', texture: 'siding', chimney: 0.7,
    decor: (x, L, eave, cx) => { window2(x, L + 10, eave + 18, 26, 26, { shutters: '#5a8a4a' }); door2(x, L + 4 * T - 42, eave + 66 - 8 - 44, 26, 44, '#a8683f') } })
  filler({ x: 0.6 * T, base_y: ROW2, w: 3.6 * T, wallH: 64, roofH: 50, roof: 'hip', roofC: '#8a5432', wall: '#b9a8d8', texture: 'siding',
    decor: (x, L, eave, cx) => { window2(x, L + 8, eave + 16, 24, 24, { box: '#6b4226' }); door2(x, L + 3.6 * T - 36, eave + 64 - 8 - 42, 24, 42, '#5a4a8a') } })
  filler({ x: 17.4 * T, base_y: ROW2, w: 4.4 * T, wallH: 72, roofH: 58, roof: 'gable', roofC: '#4a7fb0', wall: '#f4f2ec', texture: 'siding', roundWindow: true, chimney: 0.8,
    decor: (x, L, eave, cx) => { window2(x, L + 10, eave + 20, 26, 26, { shutters: '#4a7fb0' }); door2(x, L + 4.4 * T - 44, eave + 72 - 8 - 46, 28, 46, '#4a7fb0', { glass: true }) } })
  filler({ x: 24.6 * T, base_y: ROW2, w: 4.4 * T, wallH: 70, roofH: 56, roof: 'hip', roofC: '#c0563f', wall: '#f2d7a0', texture: 'brick', chimney: 0.2,
    decor: (x, L, eave, cx) => { window2(x, L + 10, eave + 20, 26, 26, { box: '#6b4226' }); window2(x, L + 4.4 * T - 36, eave + 20, 26, 26, { box: '#6b4226' }); door2(x, cx - 13, eave + 70 - 8 - 44, 26, 44, '#3f6b5a') } })

  // farm in the top right: barn, silo, crops
  filler({ x: 47 * T, base_y: 9.6 * T, w: 5.2 * T, wallH: 74, roofH: 64, roof: 'gambrel', roofC: '#4a7fb0', wall: '#b8402f', texture: 'plank', trim: '#f4efe2', base: '#6b6460',
    decor: (x, L, eave, cx) => {
      R(x, cx - 26, eave + 74 - 8 - 50, 52, 50, '#8e2a22')
      R(x, cx - 26, eave + 74 - 8 - 50, 52, 4, '#f4efe2')
      for (const [a, b] of [[cx - 26, cx], [cx, cx + 26]]) {
        R(x, a, eave + 16, 2, 50, '#f4efe2')
        for (let k = 0; k < 26; k++) {
          P(x, a + k, eave + 16 + Math.round(k * 50 / 26), '#f4efe2')
          P(x, a + k, eave + 66 - Math.round(k * 50 / 26), '#f4efe2')
        }
      }
      window2(x, cx - 12, eave - 34, 24, 18, { frame: '#f4efe2', glass: '#ffd98a' })
    } })
  place(sprite(40, 120, (x) => {
    R(x, 0, 18, 40, 102, '#9a9a96')
    wallTexture(x, 0, 18, 40, 102, 'stone', '#9a9a96')
    E(x, 20, 18, 20, 14, '#4a7fb0')
    E(x, 18, 14, 14, 8, '#6a9fd0')
    for (let k = 0; k < 18; k++) P(x, ri(2, 10), ri(60, 116), '#4f8f3a')
  }), 53.2 * T, 9.6 * T)
  // crop rows
  for (let row = 0; row < 4; row++) {
    const cy = 10.6 * T + row * 14
    R(m, 46.4 * T, cy, 8.6 * T, 8, '#8a6440')
    for (let px = 46.4 * T + 4; px < 55 * T - 6; px += 12) {
      R(m, px, cy - 3, 3, 4, '#5aa045')
      P(m, px + 1, cy - 4, '#86c463')
      if ((px + row) % 3 === 0) R(m, px + 1, cy - 6, 2, 2, row % 2 ? '#e3b04b' : '#d0453d')
    }
  }
  fenceRun(46 * T, 55.4 * T, 12.9 * T, '#c08a5a')

  // lighthouse by the lake
  place(sprite(46, 130, (x) => {
    fillPoly(x, [[8, 120], [38, 120], [32, 26], [14, 26]], '#f4efe2')
    for (const y0 of [36, 66, 96]) polyRows([[8, 120], [38, 120], [32, 26], [14, 26]], (y, a, b) => (y >= y0 && y < y0 + 14 ? R(x, a, y, b - a, 1, '#c0392f') : null))
    R(x, 10, 12, 26, 16, '#3a3a48')
    R(x, 13, 14, 20, 12, '#ffe08a')
    fillPoly(x, [[6, 13], [40, 13], [23, 0]], '#c0392f')
    R(x, 2, 26, 42, 4, '#3a3a48')
    R(x, 19, 104, 9, 16, '#5a3a24')
  }), 21.6 * T, 37.6 * T)
  // a rowing boat
  place(sprite(54, 20, (x) => {
    fillPoly(x, [[0, 4], [54, 4], [46, 18], [8, 18]], '#a8683f')
    R(x, 4, 4, 46, 3, '#7a4a2a')
    R(x, 18, 7, 18, 3, '#c08050')
  }), 6 * T, 36.2 * T)
  // campfire clearing and tent, top left
  E(m, 6 * T, 7.2 * T, 64, 30, '#b8925a')
  E(m, 6 * T, 7.2 * T, 60, 27, '#c9a46a')
  place(sprite(30, 22, (x) => {
    R(x, 2, 14, 26, 6, '#6b4226')
    R(x, 4, 10, 22, 5, '#8a5432')
    fillPoly(x, [[8, 12], [22, 12], [15, 0]], '#e3732f')
    fillPoly(x, [[11, 12], [19, 12], [15, 4]], '#ffd34a')
  }), 6 * T - 15, 7.4 * T + 6)
  place(sprite(62, 44, (x) => {
    fillPoly(x, [[0, 44], [62, 44], [31, 0]], '#d9a84a')
    fillPoly(x, [[22, 44], [40, 44], [31, 18]], '#5a3a24')
    R(x, 30, 0, 2, 44, '#b8862a')
  }), 3.2 * T, 6.6 * T)
  bench(7.8 * T, 7.8 * T, true)

  // ---------------------------------------------------------------- street things
  for (const lx of [3, 9, 15, 21, 25, 29, 35, 47, 53]) lamp(lx * T, ROW1 + 4)
  for (const lx of [5, 13, 27, 35, 41, 50]) lamp(lx * T, 20 * T + WALK + 30)
  for (const lx of [4, 10, 18, 26]) lamp(lx * T, 30 * T + WALK + 30)
  phoneBooth(21.2 * T, ROW1 + 2)
  phoneBooth(33 * T, 34.6 * T)
  busStop(18 * T, 20 * T + WALK + 34)
  fountain(plaza.x + plaza.w / 2, plaza.y + plaza.h / 2 + 30)
  bench(plaza.x + 50, plaza.y + 52)
  bench(plaza.x + plaza.w - 50, plaza.y + 52)
  bench(plaza.x + 50, plaza.y + plaza.h - 26)
  bench(plaza.x + plaza.w - 50, plaza.y + plaza.h - 26)
  lamp(plaza.x + 8, plaza.y + plaza.h / 2 + 20)
  lamp(plaza.x + plaza.w - 8, plaza.y + plaza.h / 2 + 20)
  car(4 * T, 18 * T + 32, '#d0453d')
  car(27 * T, 18 * T + 2, '#3d6fd0')
  car(49 * T, 18 * T + 32, '#e3b04b')
  car(22 * T + 2, 4 * T, '#f4efe2', true)
  car(30 * T + 34, 24 * T, '#5fb59b', true)
  car(10 * T, 28 * T + 32, '#9a5a7c')

  // park in the bottom right
  E(m, 44 * T, 37.4 * T, 60, 26, '#4f8f3a')
  E(m, 44 * T, 37.4 * T, 56, 23, '#3f8fbf')
  E(m, 44 * T, 37.4 * T, 46, 16, '#5fb4d9')
  for (const [bx, by] of [[38 * T, 34.4 * T], [47 * T, 34.4 * T]]) bench(bx, by)
  for (const [px, py] of [[36 * T, 38 * T], [52 * T, 38.6 * T]]) {
    place(sprite(50, 30, (x) => {
      R(x, 0, 6, 50, 10, '#a8683f')
      R(x, 4, 0, 42, 4, '#c08050')
      R(x, 4, 20, 42, 4, '#c08050')
      R(x, 6, 16, 4, 14, '#6b4226')
      R(x, 40, 16, 4, 14, '#6b4226')
    }), px - 25, py)
  }
  for (const [bx, by, f] of [[40 * T, 39 * T, '#f2a0b8'], [49 * T, 34 * T, '#f6e27a'], [55 * T, 35 * T, '#fdf7ec'], [34 * T, 34 * T, '#f2a0b8']]) bush(bx, by, f)

  // gardens and hedges
  for (const [bx, by, f] of [[5 * T, ROW2 - 30, '#f2a0b8'], [13.8 * T, ROW2 - 20, '#f6e27a'], [20.4 * T, ROW1 - 4, null], [7.2 * T, ROW1 + 2, '#fdf7ec'], [16.8 * T, ROW1 + 2, null], [44 * T, ROW3 + 2, '#f2a0b8'], [51.6 * T, ROW3 + 4, '#e6a6d0'], [29.6 * T, ROW2 - 2, null], [33.4 * T, 16.6 * T, '#f2a0b8']]) bush(bx, by, f)

  // ---------------------------------------------------------------- trees
  const clearSpots = []
  const blocked = (x0, y0, r) => {
    // roads, river, lake, plaza, buildings
    for (const rd of ROADS) if (x0 > rd.x * T - r - 24 && x0 < (rd.x + rd.w) * T + r + 24 && y0 > rd.y * T - r - 30 && y0 < (rd.y + rd.h) * T + r + 40) return true
    for (const [rx0, ry0] of river) if (Math.hypot(rx0 - x0, ry0 - y0) < 70 + r) return true
    if (((x0 - lake.x) / (lake.rx + 70)) ** 2 + ((y0 - lake.y) / (lake.ry + 70)) ** 2 < 1) return true
    if (x0 > plaza.x - 30 && x0 < plaza.x + plaza.w + 30 && y0 > plaza.y - 20 && y0 < plaza.y + plaza.h + 60) return true
    const boxes = [
      [0, 11.5, 5.6, 18], [7, 10, 17, 18], [33, 12, 41, 18], [46, 2, 56, 13.4], [48.4, 13.4, 53.6, 18], [0, 23, 4.6, 29.5], [6.4, 21.5, 14.8, 29.5], [16.8, 22.5, 22.2, 29.5], [24, 22.5, 29.4, 29.5], [44, 24, 52, 31], [2, 5.2, 9.5, 8.6], [31, 33.4, 35, 36.4], [36, 34, 50, 36.6], [41, 36, 47.5, 39.2], [35, 37, 38, 39.6], [50.5, 37.4, 54, 39.6], [29, 0, 31, 9], [20.4, 15.8, 22, 18], [17.2, 19.8, 19, 21.6],
    ]
    for (const [a, b2, c, d] of boxes) if (x0 > a * T - r && x0 < c * T + r && y0 > b2 * T - r && y0 < d * T + 20) return true
    if (y0 > 6 * T && y0 < 8.4 * T && x0 > 4 * T && x0 < 50 * T) return true
    for (const t of clearSpots) if (Math.hypot(t[0] - x0, t[1] - y0) < t[2] + r + 6) return true
    return false
  }
  // a thick forest along the top edge, lighter woods elsewhere
  for (let k = 0; k < 6000 && clearSpots.length < 300; k++) {
    const top = k < 2200
    const x0 = ri(10, MW - 10)
    const y0 = top ? ri(18, 5.6 * T) : ri(30, MH - 6)
    const r = ri(14, 24)
    if (!top && rnd() < 0.3) continue
    if (blocked(x0, y0, r)) continue
    clearSpots.push([x0, y0, r])
    tree(x0, y0, r, rnd() < 0.22 ? 'pine' : rnd() < 0.08 ? 'fruit' : 'round')
  }

  things.sort((a, b) => a.base - b.base)
  for (const t of things) m.drawImage(t.spr, t.X, t.Y)

  return {
    map: scaled(map, 2),
    mapSize: [MW * 2, MH * 2],
    zones: Object.fromEntries(
      Object.entries(zones).map(([id, b]) => [id, { x: Math.round(b.left * 2), y: Math.round(b.top * 2), w: Math.round((b.right - b.left) * 2), h: Math.round((b.bottom - b.top) * 2) }]),
    ),
    avatars: avatarSprites.map((s, i) => ({ id: AVATARS[i].name.toLowerCase(), png: scaled(s, 2) })),
  }
