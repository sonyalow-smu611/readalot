  // ================================================================ My Room, side on
  // Every piece of the room drawn at 1x (one canvas pixel per art pixel) with the town's own
  // helpers, so the outlines (sprite() adds the town's 1 px #1e1a24 outline) and the whole-pixel
  // shapes match the map. PAL is the room palette (src/buildings/house/strip/palette.json).
  // Each sprite can carry `meta`: points the room needs at runtime (where the glass is, where
  // books stand, the clock's middle, where a lamp glows), in the outlined sprite's own pixels.
  const C = PAL
  const out = []
  // sprite() puts the drawing 1 px in from the corner, inside its outline
  const at = (n) => n + 1
  const add = (id, w, h, fn, meta = {}) => {
    out.push({ id, spr: sprite(w, h, (x) => fn(x, w, h)), meta })
  }

  // a straight 1 px line
  const L = (x, x0, y0, x1, y1, col) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0)
    const sx = x0 < x1 ? 1 : -1
    const dy = -Math.abs(y1 - y0)
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      P(x, x0, y0, col)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) { err += dy; x0 += sx }
      if (e2 <= dx) { err += dx; y0 += sy }
    }
  }
  // a block with a light top and left edge and a dark bottom and right edge
  const panel = (x, X, Y, W, H, col, light = 1.1, dark = 0.86) => {
    R(x, X, Y, W, H, col)
    R(x, X, Y, W, 1, shade(col, light))
    R(x, X, Y, 1, H, shade(col, (light + 1) / 2))
    R(x, X, Y + H - 1, W, 1, shade(col, dark))
    R(x, X + W - 1, Y, 1, H, shade(col, dark))
  }
  // a rectangle with round corners
  const RR = (x, X, Y, W, H, r, col) => {
    R(x, X + r, Y, W - 2 * r, H, col)
    R(x, X, Y + r, W, H - 2 * r, col)
    for (const [cx, cy] of [[X + r, Y + r], [X + W - 1 - r, Y + r], [X + r, Y + H - 1 - r], [X + W - 1 - r, Y + H - 1 - r]]) E(x, cx, cy, r, r, col)
  }
  // a leaf: a small ellipse with a darker middle vein
  const leaf = (x, cx, cy, rx, ry, col) => {
    E(x, cx, cy, rx, ry, col)
    R(x, cx - Math.max(0, rx - 1), cy, Math.max(1, 2 * rx - 1), 1, shade(col, 0.8))
  }
  // a framed picture: frame, paper mat, then the picture drawn by `art` in the inner box
  const framed = (x, W, H, frame, artFn) => {
    panel(x, 0, 0, W, H, frame)
    R(x, 2, 2, W - 4, H - 4, C.paper)
    R(x, 2, H - 3, W - 4, 1, C.paperShade)
    artFn(x, 4, 4, W - 8, H - 8)
  }

  // ---------------------------------------------------------------- bay window
  {
    const W = 196, H = 184, SILL = 10, F = 6
    const panes = [[12, 44], [62, 72], [140, 44]]
    const top = F, bottom = H - SILL - F
    add('bay-window', W, H, (x) => {
      panel(x, 6, 0, W - 12, H - SILL, C.cream, 1.05, 0.9)
      // the side panes lean back in a bay: their posts a shade darker
      R(x, 6, 0, 6, H - SILL, C.creamShade)
      R(x, W - 12, 0, 6, H - SILL, C.creamShade)
      for (const [px, pw] of panes) {
        x.clearRect(px, top, pw, bottom - top)
        // the transom, two thirds of the way up
        const ty = top + Math.round((bottom - top) * 0.36)
        R(x, px, ty, pw, 4, C.cream)
        R(x, px, ty + 3, pw, 1, C.creamShade)
        R(x, px + Math.floor(pw / 2) - 1, ty + 1, 3, 2, C.mustard)
      }
      // the sill, deeper than the frame
      panel(x, 0, H - SILL, W, SILL, C.cream, 1.08, 0.82)
      R(x, 2, H - 3, W - 4, 1, C.creamShade)
    }, { glass: { x: at(12), y: at(top), w: 172, h: bottom - top }, panes: panes.map(([px, pw]) => ({ x: at(px), y: at(top), w: pw, h: bottom - top })) })
  }

  // Fabrics for the curtains (and the themes' and the Shop's curtain colours): [base, pleat
  // shadow, pleat light]. The room's own curtains are pink.
  const FABRICS = {
    pink: [C.pink, C.pinkShade, C.pinkLight],
    sage: [C.sage, C.sageShade, C.sageLight],
    navy: ['#4a5878', '#39445f', '#66779a'],
    cream: [C.cream, C.creamShade, '#fdf9f0'],
    mustard: [C.mustard, C.mustardShade, C.gold],
    rose: ['#c98a9a', '#a96f7e', '#e3b0bb'],
    blue: [C.blue, C.blueShade, C.blueLight],
    lavender: ['#b3a3c9', '#9584ad', '#cfc3e0'],
  }

  // curtains: pleated fabric gathered by a tie-back two thirds down
  const curtain = (flip, [base, dark, light] = FABRICS.pink) => (x, W, H) => {
    const fx = (n) => (flip ? W - 1 - n : n)
    const tie = Math.round(H * 0.62)
    const pts = [[0, 0], [W, 0], [W, tie - 10], [W * 0.45, tie], [W * 0.75, H], [0, H]].map(([a, b]) => [fx(a), b])
    fillPoly(x, pts, base)
    // pleats: darker and lighter stripes inside the curtain's outline
    polyRows(pts, (y, a, b) => {
      for (let i = a; i < b; i++) {
        const k = (flip ? W - 1 - i : i) % 6
        if (k === 0) P(x, i, y, dark)
        else if (k === 3) P(x, i, y, light)
      }
    })
    // the tie-back
    R(x, fx(flip ? 13 : 0), tie - 2, 14, 4, C.mustard)
    R(x, fx(flip ? 13 : 0), tie - 2, 14, 1, C.gold)
  }
  add('curtain-left', 24, 176, curtain(false))
  add('curtain-right', 24, 176, curtain(true))
  // every other fabric, as a pair: curtain-left-sage, curtain-right-sage…
  for (const [name, fabric] of Object.entries(FABRICS)) {
    if (name === 'pink') continue
    add(`curtain-left-${name}`, 24, 176, curtain(false, fabric))
    add(`curtain-right-${name}`, 24, 176, curtain(true, fabric))
  }
  // each fabric's picture in the Shop: a little pair of curtains on a rod (curtains-sage…)
  for (const [name, [base, dark, light]] of Object.entries(FABRICS)) {
    add(`curtains-${name}`, 30, 28, (x, W, H) => {
      R(x, 0, 1, W, 2, C.woodDark)
      for (const [cx, flip] of [[1, false], [W - 11, true]]) {
        const fx = (n) => (flip ? cx + 9 - n : cx + n)
        fillPoly(x, [[fx(0), 3], [fx(10), 3], [fx(10), 15], [fx(5), 18], [fx(8), H], [fx(0), H]], base)
        for (let i = 0; i < 10; i += 3) R(x, fx(i), 4, 1, H - 6, i % 2 ? light : dark)
        R(x, fx(flip ? 9 : 0), 16, 6, 2, C.mustard)
      }
    })
  }
  add('curtain-rod', 220, 5, (x, W) => {
    R(x, 3, 2, W - 6, 2, C.woodDark)
    R(x, 3, 2, W - 6, 1, C.woodShade)
    E(x, 2, 2, 2, 2, C.woodDeep)
    E(x, W - 3, 2, 2, 2, C.woodDeep)
  })

  // fairy lights along the top of the window: a sagging wire with little bulbs
  {
    const W = 204, H = 12, bulbs = []
    const wire = (X) => 2 + Math.round(6 * Math.sin(Math.PI * ((X % 51) / 51)))
    add('fairy-lights', W, H, (x) => {
      for (let X = 0; X < W; X++) P(x, X, wire(X), C.brown)
      const cols = [C.gold, C.pinkLight, C.paper, C.gold, C.teal]
      for (let X = 6, k = 0; X < W - 3; X += 12, k++) {
        const y = wire(X) + 2
        R(x, X - 1, y, 3, 3, cols[k % cols.length])
        P(x, X - 1, y, C.paper)
        bulbs.push([at(X), at(y + 1)])
      }
    }, { bulbs })
  }

  // the window seat: a cushion on a wooden bench with three open cubbies
  add('window-seat', 224, 58, (x, W, H) => {
    // cushion
    RR(x, 0, 0, W, 13, 3, C.sage)
    R(x, 2, 1, W - 4, 1, C.sageLight)
    R(x, 1, 11, W - 2, 2, C.sageShade)
    for (let X = 14; X < W - 8; X += 16) R(x, X, 5, 2, 2, C.oliveDeep)
    // bench
    panel(x, 2, 13, W - 4, H - 17, C.wood)
    const cw = 66
    for (let k = 0; k < 3; k++) {
      const X = 8 + k * (cw + 6)
      R(x, X, 18, cw, 30, C.woodDeep)
      R(x, X, 18, cw, 2, C.brownDeep)
      if (k === 0) {
        // books on end
        for (let b = 0, bx = X + 3; bx < X + cw - 6; b++) {
          const bw = 4 + ((b * 7) % 3)
          const bh = 18 + ((b * 5) % 9)
          const col = C.books[b % C.books.length][0]
          R(x, bx, 48 - bh, bw, bh, col)
          R(x, bx, 48 - bh + 2, bw, 1, C.bookBand)
          R(x, bx + bw - 1, 48 - bh, 1, bh, shade(col, 0.85))
          bx += bw + 1
        }
      } else if (k === 1) {
        // a woven basket
        panel(x, X + 6, 26, cw - 12, 22, C.mustard, 1.08, 0.82)
        for (let yy = 28; yy < 47; yy += 3) for (let xx = X + 8 + (yy % 2) * 2; xx < X + cw - 8; xx += 4) R(x, xx, yy, 2, 1, C.mustardShade)
        R(x, X + 6, 26, cw - 12, 2, C.woodShade)
      } else {
        // folded blankets
        const cols = [C.pink, C.cream, C.blueLight]
        cols.forEach((col, i) => {
          panel(x, X + 5, 36 - i * 7, cw - 10, 7, col, 1.08, 0.85)
          R(x, X + cw - 9, 37 - i * 7, 3, 5, shade(col, 0.9))
        })
      }
    }
    R(x, 2, H - 4, W - 4, 4, C.woodShade)
    R(x, 4, H - 2, 6, 2, C.woodDeep)
    R(x, W - 10, H - 2, 6, 2, C.woodDeep)
  })

  // pillows
  const pillow = (base, kind) => (x, W, H) => {
    RR(x, 0, 0, W, H, 4, base)
    RR(x, 1, 1, W - 3, H - 4, 3, shade(base, 1.06))
    R(x, 3, H - 3, W - 6, 2, shade(base, 0.85))
    if (kind === 'stripes') for (let X = 4; X < W - 3; X += 5) R(x, X, 3, 2, H - 6, shade(base, 0.9))
    if (kind === 'dots') for (let Y = 4; Y < H - 4; Y += 4) for (let X = 4 + (Y % 8 ? 2 : 0); X < W - 4; X += 5) P(x, X, Y, C.paper)
    if (kind === 'button') { E(x, W >> 1, H >> 1, 2, 2, shade(base, 0.75)); P(x, (W >> 1) - 1, (H >> 1) - 1, shade(base, 1.1)) }
  }
  add('pillow-pink', 28, 22, pillow(C.pink, 'stripes'))
  add('pillow-mustard', 25, 20, pillow(C.mustard, 'button'))
  add('pillow-sage', 24, 19, pillow(C.sage, 'dots'))

  // a small plant in a clay pot
  add('plant-sill', 20, 26, (x) => {
    fillPoly(x, [[4, 16], [16, 16], [14, 26], [6, 26]], C.rose)
    R(x, 3, 15, 14, 3, C.pinkShade)
    R(x, 5, 18, 2, 6, C.pink)
    leaf(x, 7, 8, 3, 5, C.leaf)
    leaf(x, 13, 6, 3, 6, C.leafLight)
    leaf(x, 10, 11, 4, 3, C.leafDark)
    leaf(x, 3, 13, 3, 2, C.leaf)
    leaf(x, 17, 12, 2, 3, C.leaf)
  })

  // things that hang from the ceiling on a string (the room draws the strings)
  add('hang-heart', 13, 12, (x) => {
    E(x, 3, 3, 3, 3, C.pink)
    E(x, 9, 3, 3, 3, C.pink)
    fillPoly(x, [[0, 4], [13, 4], [6.5, 12]], C.pink)
    R(x, 2, 2, 2, 1, C.pinkLight)
    R(x, 7, 9, 1, 1, C.pinkShade)
  })
  add('hang-star', 13, 13, (x) => {
    const pts = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 2.6 : 6.4
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      pts.push([6.5 + r * Math.cos(a), 7 + r * Math.sin(a)])
    }
    fillPoly(x, pts, C.mustard)
    P(x, 6, 3, C.gold)
    P(x, 5, 5, C.gold)
  })
  add('hang-moon', 11, 14, (x) => {
    E(x, 5, 7, 5, 6, C.paper)
    x.save(); x.globalCompositeOperation = 'destination-out'; E(x, 8, 5, 4, 5, '#000'); x.restore()
    P(x, 2, 9, C.paperShade)
  })
  add('hang-cloud', 18, 10, (x) => {
    E(x, 5, 6, 4, 3, C.paper)
    E(x, 10, 4, 5, 4, C.paper)
    E(x, 14, 6, 3, 3, C.paper)
    R(x, 3, 8, 13, 1, C.paperShade)
  })

  // bunting along the top of the wall: a sagging string of little cloth flags
  add('bunting', 120, 16, (x, W) => {
    const sag = (X) => 1 + Math.round(5 * Math.sin(Math.PI * (X / (W - 1))))
    for (let X = 0; X < W; X++) P(x, X, sag(X), C.woodDark)
    const cols = [C.pink, C.mustard, C.sage, C.cream, C.blueLight, C.pinkLight]
    for (let X = 4, k = 0; X < W - 8; X += 10, k++) {
      const y = sag(X + 3) + 1
      fillPoly(x, [[X, y], [X + 7, y], [X + 3.5, y + 8]], cols[k % cols.length])
      R(x, X + 1, y, 5, 1, shade(cols[k % cols.length], 1.08))
    }
  })

  // ---------------------------------------------------------------- reading corner
  // Lamp styles: the shade (unlit), its ribs and rim, and the stand. Brass is the room's own.
  const LAMPS = {
    brass: { shade: C.lampShade, rib: C.mustard, rim: C.mustardShade, stand: C.brown, edge: C.slate, base: C.sage, baseLight: C.sageLight, baseDark: C.sageShade },
    white: { shade: '#f6f1e6', rib: '#e2d9c6', rim: '#cfc3ab', stand: C.woodLight, edge: C.woodShade, base: C.cream, baseLight: '#fdf9f0', baseDark: C.creamShade },
    green: { shade: '#7fa47a', rib: '#6a8f66', rim: '#557a52', stand: '#b8913f', edge: '#8f6f2e', base: '#7fa47a', baseLight: '#a3c49c', baseDark: '#557a52' },
  }

  const lamp = (lit, style = LAMPS.brass) => (x, W, H) => {
    const shadeTop = 22, shadeBottom = 34
    const pts = [[(W - shadeTop) / 2, 0], [(W + shadeTop) / 2, 0], [(W + shadeBottom) / 2, 30], [(W - shadeBottom) / 2, 30]]
    fillPoly(x, pts, lit ? C.lampLit : style.shade)
    polyRows(pts, (y, a, b) => {
      for (let i = a; i < b; i++) if ((i - a) % 5 === 0) P(x, i, y, lit ? C.gold : style.rib)
    })
    R(x, (W - shadeBottom) / 2, 29, shadeBottom, 1, lit ? C.windowGlow : style.rim)
    if (lit) R(x, (W - shadeBottom) / 2 + 3, 26, shadeBottom - 6, 3, C.windowGlow)
    R(x, (W >> 1) - 1, 30, 2, H - 36, style.stand)
    R(x, (W >> 1) - 1, 30, 1, H - 36, style.edge)
    E(x, W >> 1, H - 4, 11, 3, style.stand)
    R(x, (W >> 1) - 10, H - 4, 20, 1, style.edge)
  }
  add('floor-lamp', 36, 152, lamp(false), { glow: { x: at(18), y: at(24) } })
  add('floor-lamp-lit', 36, 152, lamp(true), { glow: { x: at(18), y: at(24) } })
  for (const name of ['white', 'green']) {
    add(`floor-lamp-${name}`, 36, 152, lamp(false, LAMPS[name]), { glow: { x: at(18), y: at(24) } })
    add(`floor-lamp-${name}-lit`, 36, 152, lamp(true, LAMPS[name]), { glow: { x: at(18), y: at(24) } })
  }

  // the wingback armchair: tufted back, rolled arms, short wooden legs
  add('armchair', 106, 114, (x, W, H) => {
    const body = C.sageShade
    const back = [[14, 10], [22, 2], [84, 2], [92, 10], [92, 72], [14, 72]]
    fillPoly(x, back, body)
    // diamond tufting: diagonal seams and buttons where they cross
    polyRows(back, (y, a, b) => {
      for (let i = a + 1; i < b - 1; i++) {
        const u = (i - 14 + (y - 2)) % 12
        const v = (i - 14 - (y - 2) + 1200) % 12
        if (u === 0 || v === 0) P(x, i, y, C.olive)
      }
    })
    for (let y = 8; y < 68; y += 12) for (let i = 20; i < 90; i += 12) R(x, i + ((y / 12) % 2 ? 6 : 0), y + 4, 2, 2, C.oliveDeep)
    R(x, 22, 3, 62, 1, C.sageLight)
    // wings
    fillPoly(x, [[6, 18], [14, 12], [20, 14], [20, 66], [6, 66]], shade(body, 0.92))
    fillPoly(x, [[100, 18], [92, 12], [86, 14], [86, 66], [100, 66]], shade(body, 0.92))
    // the front of the seat, under the cushion
    R(x, 18, 72, 70, 24, shade(body, 0.9))
    R(x, 18, 86, 70, 1, C.olive)
    // seat cushion
    RR(x, 20, 64, 66, 14, 3, C.sage)
    R(x, 22, 65, 62, 1, C.sageLight)
    R(x, 21, 76, 64, 2, C.sageShade)
    // rolled arms with a scroll on the front
    for (const ax of [0, 82]) {
      RR(x, ax, 56, 24, 46, 6, body)
      E(x, ax + 12, 61, 11, 6, C.sage)
      R(x, ax + 4, 58, 16, 1, C.sageLight)
      E(x, ax + 12, 72, 5, 5, C.olive)
      E(x, ax + 12, 72, 3, 3, body)
      P(x, ax + 12, 72, C.oliveDeep)
      R(x, ax + 2, 80, 20, 1, C.olive)
    }
    // skirt and legs
    R(x, 4, 94, 98, 10, shade(body, 0.85))
    R(x, 4, 94, 98, 1, C.olive)
    for (const lx of [10, 92]) fillPoly(x, [[lx, 104], [lx + 5, 104], [lx + 4, 114], [lx + 1, 114]], C.woodDark)
  })

  // a knitted throw over the chair's arm
  add('throw', 26, 42, (x, W, H) => {
    R(x, 0, 0, W, H - 3, C.pink)
    for (let y = 2; y < H - 4; y += 3) for (let i = (y % 2) * 2; i < W; i += 4) { P(x, i, y, C.pinkShade); P(x, i + 1, y + 1, C.pinkShade) }
    R(x, 0, 0, W, 2, C.pinkLight)
    for (let i = 1; i < W; i += 3) R(x, i, H - 3, 1, 3, C.pinkShade)
  })

  // a low coffee table, with magazines on its shelf
  add('coffee-table', 88, 30, (x, W, H) => {
    panel(x, 0, 0, W, 6, C.wood, 1.12, 0.8)
    R(x, 2, 6, W - 4, 1, C.woodDeep)
    for (const lx of [4, W - 9]) panel(x, lx, 6, 5, H - 6, C.woodShade)
    R(x, 9, 20, W - 18, 3, C.woodShade)
    panel(x, 14, 15, 26, 5, C.blue)
    panel(x, 18, 12, 22, 3, C.pinkLight)
    panel(x, 50, 16, 20, 4, C.cream)
  })
  add('side-table', 40, 48, (x, W, H) => {
    panel(x, 0, 0, W, 5, C.wood, 1.12, 0.8)
    R(x, 2, 5, W - 4, 1, C.woodDeep)
    panel(x, 17, 6, 6, H - 12, C.woodShade)
    fillPoly(x, [[6, H - 4], [34, H - 4], [30, H - 6], [10, H - 6]], C.woodShade)
    R(x, 5, H - 4, 30, 4, C.woodDark)
  })
  add('mug', 10, 9, (x) => {
    panel(x, 0, 0, 7, 9, C.cream)
    R(x, 0, 3, 7, 2, C.pink)
    R(x, 7, 2, 2, 1, C.cream)
    R(x, 8, 2, 1, 4, C.cream)
    R(x, 7, 5, 2, 1, C.cream)
    R(x, 1, 0, 5, 1, C.brown)
  })
  add('open-book', 24, 8, (x, W) => {
    fillPoly(x, [[0, 2], [11, 4], [11, 8], [0, 6]], C.paper)
    fillPoly(x, [[13, 4], [24, 2], [24, 6], [13, 8]], C.paper)
    R(x, 11, 3, 2, 5, C.red)
    for (let i = 2; i < 10; i += 2) { P(x, i, 4, C.greyShade); P(x, W - 1 - i, 4, C.greyShade) }
    R(x, 0, 6, 11, 1, C.paperShade)
    R(x, 13, 6, 11, 1, C.paperShade)
  })
  const stack = (books) => (x, W, H) => {
    let y = H
    for (const [w, h, col, dx] of books) {
      y -= h
      panel(x, dx, y, w, h, col, 1.1, 0.8)
      R(x, dx + 1, y + 1, w - 2, 1, C.paper)
    }
  }
  add('book-stack', 18, 14, stack([[18, 5, C.blue, 0], [16, 4, C.pink, 1], [14, 5, C.mustard, 2]]))
  add('book-pile-floor', 24, 30, stack([[24, 6, C.sageShade, 0], [22, 5, C.rose, 1], [23, 6, C.blue, 0], [20, 5, C.mustard, 2], [18, 5, C.teal, 3], [16, 3, C.cream, 4]]))

  // the rug's front edge along the floor, with a fringe: [base, light dash, dark dash]
  const rug = ([base, light, dark]) => (x, W) => {
    R(x, 0, 0, W, 5, base)
    for (let i = 0; i < W; i += 8) { R(x, i, 1, 4, 1, light); R(x, i + 4, 3, 4, 1, dark) }
    for (let i = 1; i < W; i += 3) P(x, i, 5, C.cream)
  }
  add('rug', 200, 7, rug([C.pink, C.pinkLight, C.rose]))
  add('rug-sage', 200, 7, rug([C.sage, C.sageLight, C.sageShade]))
  add('rug-navy', 200, 7, rug(FABRICS.navy))
  add('rug-rust', 200, 7, rug(['#b5643f', '#d08a62', '#8f4a2e']))
  add('knit-basket', 28, 24, (x, W, H) => {
    E(x, 9, 9, 6, 6, C.pink)
    E(x, 18, 10, 5, 5, C.blue)
    E(x, 13, 7, 4, 4, C.sage)
    P(x, 7, 7, C.pinkLight)
    P(x, 17, 8, C.blueLight)
    L(x, 15, 9, 22, 0, C.woodDark)
    L(x, 17, 10, 26, 2, C.woodDark)
    panel(x, 1, 11, W - 2, H - 11, C.mustard, 1.1, 0.8)
    for (let y = 13; y < H - 1; y += 3) for (let i = 3 + (y % 2) * 2; i < W - 3; i += 4) R(x, i, y, 2, 1, C.mustardShade)
  })

  // framed pictures for the walls
  add('frame-a', 22, 28, (x, W, H) => framed(x, W, H, C.woodDark, (x2, X, Y, w, h) => {
    R(x2, X, Y, w, h, C.blueLight)
    E(x2, X + w - 4, Y + 4, 2, 2, C.paper)
    fillPoly(x2, [[X, Y + h], [X + 5, Y + 8], [X + 9, Y + 12], [X + 13, Y + 6], [X + w, Y + h]], C.sageShade)
  }))
  add('frame-b', 28, 20, (x, W, H) => framed(x, W, H, C.wood, (x2, X, Y, w, h) => {
    R(x2, X, Y, w, h, C.teal)
    for (let i = 0; i < w; i += 4) { P(x2, X + i, Y + 6, C.paper); P(x2, X + i + 2, Y + 5, C.paper) }
    R(x2, X, Y + h - 3, w, 3, C.tealShade)
  }))
  add('frame-c', 18, 18, (x, W, H) => framed(x, W, H, C.cream, (x2, X, Y, w, h) => {
    R(x2, X, Y, w, h, C.pinkLight)
    R(x2, X + 4, Y + 4, 1, h - 4, C.leafDark)
    E(x2, X + 4, Y + 3, 2, 2, C.pink)
    P(x2, X + 4, Y + 3, C.gold)
  }))
  add('frame-d', 20, 26, (x, W, H) => framed(x, W, H, C.woodDark, (x2, X, Y, w, h) => {
    R(x2, X, Y, w, h, C.gold)
    E(x2, X + w / 2, Y + h - 5, 4, 4, C.brown)
    E(x2, X + w / 2, Y + h - 11, 3, 3, C.brown)
    P(x2, X + w / 2 - 2, Y + h - 15, C.brown)
    P(x2, X + w / 2 + 2, Y + h - 15, C.brown)
  }))
  add('frame-e', 30, 22, (x, W, H) => framed(x, W, H, C.wood, (x2, X, Y, w, h) => {
    const bands = [C.pinkLight, C.pink, C.mustard, C.rose]
    bands.forEach((col, i) => R(x2, X, Y + Math.floor((i * h) / 4), w, Math.ceil(h / 4), col))
    E(x2, X + w / 2, Y + h - 3, 4, 3, C.gold)
  }))

  // a wall shelf and the little things on it
  add('wall-shelf', 72, 7, (x, W) => {
    panel(x, 0, 0, W, 4, C.wood, 1.12, 0.8)
    fillPoly(x, [[8, 4], [13, 4], [8, 7]], C.woodShade)
    fillPoly(x, [[W - 13, 4], [W - 8, 4], [W - 8, 7]], C.woodShade)
  })
  add('jar', 10, 13, (x, W, H) => {
    R(x, 1, 3, W - 2, H - 3, C.blueLight)
    R(x, 2, 6, W - 4, H - 7, C.mustard)
    R(x, 2, 4, 1, H - 5, C.paper)
    R(x, 0, 0, W, 3, C.woodDark)
  })
  add('candle', 6, 12, (x) => {
    panel(x, 0, 5, 6, 7, C.paper)
    R(x, 2, 3, 2, 2, C.brownDeep)
    E(x, 3, 1, 1, 1, C.gold)
  })
  add('plant-pot-small', 16, 20, (x) => {
    panel(x, 3, 12, 10, 8, C.cream)
    R(x, 3, 14, 10, 1, C.teal)
    leaf(x, 5, 7, 3, 5, C.leaf)
    leaf(x, 11, 6, 3, 6, C.leafLight)
    leaf(x, 8, 4, 2, 4, C.leafDark)
  })
  add('photo-small', 13, 15, (x, W, H) => {
    panel(x, 0, 0, W, H - 2, C.woodShade)
    R(x, 2, 2, W - 4, H - 6, C.blueLight)
    E(x, 6, 7, 2, 2, C.pinkLight)
    R(x, 2, 8, W - 4, H - 10, C.sage)
    R(x, 4, H - 2, W - 8, 2, C.woodDark)
  })

  // ---------------------------------------------------------------- bookshelf
  // Five compartments behind straight, evenly spaced boards. The middle three are where the
  // reader's books stand (drawn by the room): To be read, Reading, Finished, top down.
  {
    const W = 154, H = 270, SIDE = 6, TOP = 10, ROW = 46, BOARD = 5
    const rows = []
    add('bookshelf', W, H, (x) => {
      panel(x, 0, 0, W, H, C.woodShade, 1.08, 0.82)
      R(x, SIDE, TOP, W - 2 * SIDE, H - TOP - 10, C.woodDeep)
      for (let X = SIDE + 17; X < W - SIDE; X += 18) R(x, X, TOP, 1, H - TOP - 10, C.brown)
      // crown and plinth
      panel(x, 0, 0, W, 6, C.wood, 1.12, 0.85)
      panel(x, 0, H - 10, W, 10, C.wood, 1.12, 0.8)
      for (let k = 0; k < 5; k++) {
        const y = TOP + k * (ROW + BOARD)
        if (k > 0) {
          panel(x, SIDE, y - BOARD, W - 2 * SIDE, BOARD, C.wood, 1.14, 0.82)
          R(x, SIDE, y, W - 2 * SIDE, 1, C.brownDeep)
        }
        if (k >= 1 && k <= 3) rows.push({ x: at(SIDE + 2), y: at(y), w: W - 2 * SIDE - 4, h: ROW, base: at(y + ROW) })
      }
      // the top compartment: a trailing plant, a jar, a photo, a candle and a few books flat
      const ty = TOP + ROW
      fillPoly(x, [[12, ty - 12], [26, ty - 12], [24, ty], [14, ty]], C.rose)
      R(x, 11, ty - 13, 16, 2, C.pinkShade)
      leaf(x, 15, ty - 17, 3, 5, C.leaf); leaf(x, 22, ty - 18, 3, 6, C.leafLight); leaf(x, 19, ty - 22, 2, 4, C.leafDark)
      for (let k = 0; k < 6; k++) leaf(x, 10 - (k % 2), ty - 8 + k * 6, 2, 3, k % 2 ? C.leaf : C.leafDark)
      R(x, 38, ty - 14, 10, 14, C.blueLight); R(x, 39, ty - 10, 8, 9, C.pinkLight); R(x, 37, ty - 16, 12, 3, C.woodDark); R(x, 39, ty - 13, 1, 12, C.paper)
      panel(x, 58, ty - 18, 14, 18, C.wood); R(x, 60, ty - 16, 10, 12, C.teal); E(x, 65, ty - 12, 2, 2, C.paper); R(x, 60, ty - 9, 10, 5, C.sage)
      panel(x, 82, ty - 10, 6, 10, C.paper); R(x, 84, ty - 12, 2, 2, C.brownDeep); P(x, 85, ty - 14, C.gold)
      ;[[24, 5, C.sageShade], [22, 4, C.pink], [20, 5, C.blue]].reduce((y, [w, h, col], i) => {
        panel(x, 100 + i, y - h, w, h, col, 1.1, 0.8)
        return y - h
      }, ty)
      // the bottom compartment: two storage boxes with paper labels
      const by = TOP + 4 * (ROW + BOARD) + ROW
      for (const [bx, col] of [[12, C.cream], [78, C.sage]]) {
        panel(x, bx, by - 30, 62, 30, col, 1.08, 0.82)
        R(x, bx, by - 30, 62, 3, shade(col, 0.88))
        panel(x, bx + 22, by - 20, 18, 8, C.paper)
        R(x, bx + 25, by - 17, 12, 1, C.greyShade)
      }
    }, { rows })
  }

  // ---------------------------------------------------------------- clock and corkboard
  add('clock', 30, 30, (x) => {
    E(x, 15, 15, 14, 14, C.woodDark)
    E(x, 15, 15, 12, 12, C.paper)
    E(x, 15, 15, 11, 11, C.cream)
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2
      const r = h % 3 ? 10 : 9
      R(x, Math.round(15 + Math.sin(a) * r), Math.round(15 - Math.cos(a) * r), h % 3 ? 1 : 2, h % 3 ? 1 : 2, C.slate)
    }
    R(x, 14, 14, 3, 3, C.brownDeep)
  }, { centre: { x: at(15), y: at(15) }, hands: { hour: 6, minute: 9 } })

  add('corkboard', 112, 80, (x, W, H) => {
    panel(x, 0, 0, W, H, C.wood, 1.12, 0.8)
    R(x, 4, 4, W - 8, H - 8, C.cork)
    for (let k = 0; k < 160; k++) P(x, ri(5, W - 6), ri(5, H - 6), rnd() < 0.5 ? C.corkShade : C.woodLight)
    const note = (X, Y, w, h, col, lines) => {
      R(x, X + 1, Y + 1, w, h, shade(C.cork, 0.8))
      panel(x, X, Y, w, h, col, 1.05, 0.88)
      for (let i = 0; i < lines; i++) R(x, X + 3, Y + 5 + i * 3, w - 6 - (i % 2) * 4, 1, C.greyShade)
    }
    const photo = (X, Y, w, h, sky, ground) => {
      R(x, X + 1, Y + 1, w, h, shade(C.cork, 0.8))
      panel(x, X, Y, w, h, C.paper)
      R(x, X + 2, Y + 2, w - 4, h - 8, sky)
      fillPoly(x, [[X + 2, Y + h - 6], [X + 7, Y + h - 12], [X + 12, Y + h - 9], [X + w - 2, Y + h - 13], [X + w - 2, Y + h - 6]], ground)
    }
    const pin = (X, Y, col) => { R(x, X, Y, 2, 2, col); P(x, X, Y, shade(col, 1.3)) }
    note(10, 10, 22, 20, C.paper, 4)
    note(38, 8, 18, 18, C.pinkLight, 3)
    photo(62, 10, 22, 24, C.blueLight, C.sage)
    note(89, 14, 18, 16, C.sageLight, 3)
    note(12, 44, 16, 16, C.gold, 3)
    photo(36, 44, 20, 22, C.pinkLight, C.rose)
    note(66, 40, 30, 28, C.paper, 6)
    const pins = [[20, 9, C.red], [46, 7, C.blue], [72, 9, C.mustard], [97, 13, C.red], [19, 43, C.blue], [45, 43, C.red], [80, 39, C.teal]]
    // a string from pin to pin, like a map of plans
    L(x, 47, 8, 73, 10, C.red)
    L(x, 73, 10, 46, 44, C.red)
    L(x, 46, 44, 81, 40, C.red)
    for (const [px, py, col] of pins) pin(px, py, col)
  })

  add('dresser', 94, 58, (x, W, H) => {
    panel(x, 0, 0, W, 5, C.wood, 1.12, 0.8)
    panel(x, 2, 5, W - 4, H - 10, C.woodLight, 1.05, 0.85)
    for (const [dx, dy] of [[5, 8], [48, 8], [5, 28], [48, 28]]) {
      panel(x, dx, dy, 41, 17, C.wood, 1.08, 0.82)
      R(x, dx + 18, dy + 7, 5, 2, C.mustardShade)
      P(x, dx + 18, dy + 7, C.gold)
    }
    R(x, 2, H - 5, W - 4, 2, C.woodShade)
    for (const lx of [5, W - 10]) R(x, lx, H - 3, 5, 3, C.woodDark)
  })
  add('radio', 24, 16, (x, W, H) => {
    L(x, 18, 0, 22, 5, C.slate)
    RR(x, 0, 4, W, H - 4, 2, C.teal)
    R(x, 2, 6, 10, 8, C.tealShade)
    for (let yy = 7; yy < 13; yy += 2) for (let xx = 3; xx < 11; xx += 2) P(x, xx, yy, C.teal)
    R(x, 14, 7, 8, 3, C.gold)
    E(x, 18, 12, 1, 1, C.cream)
  })
  add('vase-flowers', 16, 28, (x) => {
    for (const [sx, top] of [[5, 6], [8, 3], [11, 7]]) R(x, sx, top, 1, 18 - top, C.leafDark)
    leaf(x, 4, 12, 2, 1, C.leaf)
    leaf(x, 12, 13, 2, 1, C.leaf)
    for (const [fx, fy, col] of [[5, 5, C.pink], [8, 2, C.gold], [11, 6, C.pinkLight]]) {
      E(x, fx, fy, 2, 2, col)
      P(x, fx, fy, C.mustardShade)
    }
    fillPoly(x, [[4, 18], [12, 18], [13, 24], [11, 28], [5, 28], [3, 24]], C.blue)
    R(x, 5, 20, 1, 6, C.blueLight)
  })
  add('jar-pens', 9, 14, (x) => {
    R(x, 2, 0, 1, 6, C.red)
    R(x, 4, 1, 1, 5, C.blue)
    R(x, 6, 0, 1, 6, C.mustard)
    panel(x, 0, 5, 9, 9, C.slate, 1.2, 0.85)
  })
  add('light-switch', 7, 10, (x) => {
    panel(x, 0, 0, 7, 10, C.cream)
    R(x, 2, 3, 3, 4, C.creamShade)
    R(x, 3, 3, 1, 2, C.paper)
  })
  add('outlet-cable', 40, 24, (x) => {
    panel(x, 0, 0, 9, 10, C.cream)
    R(x, 2, 3, 1, 2, C.slate)
    R(x, 6, 3, 1, 2, C.slate)
    R(x, 3, 6, 3, 3, C.paperShade)
    // the plug's cable drops to the floor and runs off along it
    for (let y = 9; y < 22; y++) P(x, 4 + Math.round((y - 9) * 0.3), y, C.brownDeep)
    L(x, 8, 22, 39, 22, C.brownDeep)
  })

  // ---------------------------------------------------------------- bed corner
  add('nightstand', 46, 46, (x, W, H) => {
    panel(x, 0, 0, W, 5, C.wood, 1.12, 0.8)
    panel(x, 2, 5, W - 4, 14, C.woodLight, 1.05, 0.85)
    R(x, 20, 10, 6, 2, C.mustardShade)
    R(x, 2, 19, W - 4, H - 23, C.woodDeep)
    R(x, 2, 19, 2, H - 23, C.woodShade)
    R(x, W - 4, 19, 2, H - 23, C.woodShade)
    ;[[30, 5, C.pink], [26, 4, C.sageShade], [28, 5, C.blueLight]].reduce((y, [w, h, col], i) => {
      panel(x, 6 + i * 2, y - h, w, h, col, 1.1, 0.8)
      return y - h
    }, H - 5)
    R(x, 2, H - 5, W - 4, 2, C.woodShade)
    for (const lx of [3, W - 7]) R(x, lx, H - 3, 4, 3, C.woodDark)
  })
  const tableLamp = (lit, style = LAMPS.brass) => (x, W, H) => {
    const pts = [[6, 0], [W - 6, 0], [W - 1, 14], [0, 14]]
    fillPoly(x, pts, lit ? C.lampLit : style === LAMPS.brass ? C.mustard : style.shade)
    polyRows(pts, (y, a, b) => { for (let i = a; i < b; i++) if ((i - a) % 4 === 0) P(x, i, y, lit ? C.gold : style === LAMPS.brass ? C.mustardShade : style.rib) })
    if (lit) R(x, 2, 12, W - 4, 2, C.windowGlow)
    R(x, (W >> 1) - 1, 14, 2, 6, C.brown)
    E(x, W >> 1, H - 7, 6, 6, style.base)
    R(x, (W >> 1) - 4, H - 10, 2, 4, style.baseLight)
    R(x, (W >> 1) - 5, H - 2, 10, 2, style.baseDark)
  }
  add('table-lamp', 24, 34, tableLamp(false), { glow: { x: at(12), y: at(10) } })
  add('table-lamp-lit', 24, 34, tableLamp(true), { glow: { x: at(12), y: at(10) } })
  for (const name of ['white', 'green']) {
    add(`table-lamp-${name}`, 24, 34, tableLamp(false, LAMPS[name]), { glow: { x: at(12), y: at(10) } })
    add(`table-lamp-${name}-lit`, 24, 34, tableLamp(true, LAMPS[name]), { glow: { x: at(12), y: at(10) } })
  }

  // Bedding: the quilt's pattern over its box (x from X0 to X1, y from Y0 to Y1), the front pillow,
  // the hem and the folded throw. Patchwork is the room's own.
  const QUILTS = {
    patchwork: (x, X0, Y0, X1, Y1) => {
      const cols = [C.sage, C.pink, C.cream, C.mustard, C.blueLight, C.pinkLight, C.sageLight]
      for (let qy = Y0, r = 0; qy < Y1; qy += 8, r++) {
        for (let qx = X0, c = 0; qx < X1; qx += 12, c++) {
          const col = cols[(r * 3 + c) % cols.length]
          R(x, qx, qy, 12, 8, col)
          R(x, qx, qy, 12, 1, shade(col, 1.08))
          R(x, qx + 11, qy, 1, 8, C.paperShade)
        }
      }
    },
    gingham: (x, X0, Y0, X1, Y1) => {
      R(x, X0, Y0, X1 - X0, Y1 - Y0, '#f6f1e6')
      for (let qx = X0; qx < X1; qx += 8) R(x, qx, Y0, 4, Y1 - Y0, '#e9b9b4')
      for (let qy = Y0; qy < Y1; qy += 8) R(x, X0, qy, X1 - X0, 4, '#e9b9b4')
      for (let qx = X0; qx < X1; qx += 8) for (let qy = Y0; qy < Y1; qy += 8) R(x, qx, qy, 4, 4, '#d48f8a')
    },
    stripes: (x, X0, Y0, X1, Y1) => {
      const cols = [C.blueLight, C.cream, C.blue, C.cream]
      for (let qx = X0, k = 0; qx < X1; qx += 5, k++) R(x, qx, Y0, 5, Y1 - Y0, cols[k % cols.length])
    },
    floral: (x, X0, Y0, X1, Y1) => {
      R(x, X0, Y0, X1 - X0, Y1 - Y0, '#f4dcdc')
      for (let qy = Y0 + 3, r = 0; qy < Y1 - 1; qy += 9, r++) {
        for (let qx = X0 + 4 + (r % 2) * 7; qx < X1 - 2; qx += 14) {
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) P(x, qx + dx, qy + dy, '#d97d8c')
          P(x, qx, qy, C.mustard)
          P(x, qx + 3, qy + 2, C.leaf)
        }
      }
    },
    stars: (x, X0, Y0, X1, Y1) => {
      R(x, X0, Y0, X1 - X0, Y1 - Y0, '#3f4a6b')
      for (let qy = Y0 + 3, r = 0; qy < Y1 - 1; qy += 8, r++) {
        for (let qx = X0 + 3 + (r % 2) * 6; qx < X1 - 2; qx += 12) {
          P(x, qx, qy, C.gold)
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) P(x, qx + dx, qy + dy, '#e9d8a0')
        }
      }
      E(x, X1 - 14, Y0 + 7, 3, 3, '#f4efe2')
      E(x, X1 - 13, Y0 + 6, 2, 2, '#3f4a6b')
    },
    tartan: (x, X0, Y0, X1, Y1) => {
      R(x, X0, Y0, X1 - X0, Y1 - Y0, '#8f3a33')
      for (let qx = X0 + 4; qx < X1; qx += 14) R(x, qx, Y0, 4, Y1 - Y0, '#2f4a3a')
      for (let qy = Y0 + 4; qy < Y1; qy += 12) R(x, X0, qy, X1 - X0, 3, '#2f4a3a')
      for (let qx = X0 + 10; qx < X1; qx += 14) R(x, qx, Y0, 1, Y1 - Y0, C.gold)
      for (let qy = Y0 + 9; qy < Y1; qy += 12) R(x, X0, qy, X1 - X0, 1, C.gold)
    },
  }
  const BEDDING = {
    patchwork: { quilt: 'patchwork', pillow: [C.pinkLight, C.pink], hem: C.sage, throw: [C.mustard, C.mustardShade] },
    gingham: { quilt: 'gingham', pillow: ['#f6f1e6', '#e9b9b4'], hem: '#d48f8a', throw: [C.sage, C.sageShade] },
    stripes: { quilt: 'stripes', pillow: [C.blueLight, C.blue], hem: C.blue, throw: [C.cream, C.creamShade] },
    floral: { quilt: 'floral', pillow: ['#f4dcdc', '#d97d8c'], hem: C.leaf, throw: [C.sage, C.sageShade] },
    stars: { quilt: 'stars', pillow: ['#66779a', '#3f4a6b'], hem: C.gold, throw: [C.gold, C.mustardShade] },
    tartan: { quilt: 'tartan', pillow: [C.cream, C.creamShade], hem: '#2f4a3a', throw: ['#2f4a3a', '#22362a'] },
  }

  // the bed, side on: headboard on the left, a quilt, pillows, a throw at the foot
  const bed = (design) => (x, W, H) => {
    // headboard and footboard
    RR(x, 0, 0, 16, H - 6, 4, C.wood)
    R(x, 3, 6, 10, H - 18, C.woodLight)
    R(x, 3, 6, 10, 1, C.paper)
    panel(x, W - 14, 36, 14, H - 42, C.wood)
    R(x, W - 11, 40, 8, H - 50, C.woodLight)
    // rail and legs
    panel(x, 16, 62, W - 30, 12, C.woodShade, 1.1, 0.8)
    for (const lx of [2, W - 12]) R(x, lx, H - 6, 9, 6, C.woodDark)
    // mattress
    R(x, 16, 42, W - 30, 20, C.cream)
    for (let i = 20; i < W - 16; i += 6) P(x, i, 52, C.creamShade)
    R(x, 16, 60, W - 30, 2, C.creamShade)
    // pillows
    RR(x, 16, 24, 36, 20, 6, C.paper)
    R(x, 20, 40, 28, 2, C.paperShade)
    RR(x, 22, 18, 30, 18, 6, design.pillow[0])
    R(x, 26, 32, 22, 2, design.pillow[1])
    // the quilt, hanging over the side with a wavy hem
    QUILTS[design.quilt](x, 50, 34, W - 14, 66)
    R(x, 50, 34, W - 64, 1, C.paper)
    for (let qx = 50; qx < W - 14; qx++) if (Math.floor(qx / 6) % 2) P(x, qx, 66, design.hem)
    // a folded throw at the foot
    panel(x, W - 52, 28, 36, 10, design.throw[0], 1.1, 0.82)
    for (let i = W - 50; i < W - 18; i += 4) R(x, i, 30, 2, 6, design.throw[1])
  }
  add('bed', 214, 90, bed(BEDDING.patchwork))
  // every other design: bed-gingham, bed-stripes…
  for (const [name, design] of Object.entries(BEDDING)) {
    if (name !== 'patchwork') add(`bed-${name}`, 214, 90, bed(design))
  }
  // each design's picture in the Shop: the quilt folded on a pillow (bedding-gingham…)
  for (const [name, design] of Object.entries(BEDDING)) {
    add(`bedding-${name}`, 32, 26, (x, W, H) => {
      RR(x, 2, 0, 20, 10, 3, design.pillow[0])
      R(x, 5, 7, 14, 1, design.pillow[1])
      QUILTS[design.quilt](x, 0, 9, W, H - 3)
      R(x, 0, 9, W, 1, C.paper)
      for (let qx = 0; qx < W; qx++) if (Math.floor(qx / 4) % 2) P(x, qx, H - 3, design.hem)
      R(x, 0, H - 2, W, 2, shade(design.hem, 0.85))
    })
  }

  add('poster-a', 36, 48, (x, W, H) => {
    panel(x, 0, 0, W, H, C.paper, 1, 0.9)
    R(x, 3, 3, W - 6, H - 14, C.blueShade)
    for (const [sx, sy] of [[8, 8], [24, 6], [14, 14], [28, 16], [6, 18]]) P(x, sx, sy, C.paper)
    E(x, 24, 12, 4, 4, C.cream)
    E(x, 26, 10, 3, 3, C.blueShade)
    fillPoly(x, [[3, H - 11], [10, 22], [17, 30], [24, 20], [W - 3, H - 11]], C.sage)
    fillPoly(x, [[10, 22], [13, 25], [8, 25]], C.paper)
    R(x, 6, H - 8, W - 12, 2, C.slate)
    R(x, 10, H - 5, W - 20, 1, C.greyShade)
    for (const [tx, ty] of [[0, 0], [W - 4, 0]]) R(x, tx, ty, 4, 3, C.pinkLight)
  })
  add('poster-b', 30, 40, (x, W, H) => {
    panel(x, 0, 0, W, H, C.cream, 1, 0.9)
    R(x, W >> 1, 6, 1, H - 12, C.leafDark)
    for (let k = 0; k < 4; k++) {
      leaf(x, (W >> 1) - 5, 10 + k * 7, 4, 2, k % 2 ? C.leaf : C.leafLight)
      leaf(x, (W >> 1) + 5, 13 + k * 7, 4, 2, k % 2 ? C.leafLight : C.leaf)
    }
    R(x, 6, H - 4, W - 12, 1, C.greyShade)
    for (const [tx, ty] of [[0, 0], [W - 4, 0]]) R(x, tx, ty, 4, 3, C.sageLight)
  })

  // ---------------------------------------------------------------- plants and odds and ends
  add('plant-floor', 46, 74, (x, W, H) => {
    for (const [sx, sy, ex, ey] of [[23, 54, 10, 22], [23, 54, 34, 18], [23, 54, 22, 10], [23, 54, 6, 38], [23, 54, 40, 36]]) L(x, sx, sy, ex, ey, C.leafDark)
    for (const [cx, cy, rx, ry, col] of [[10, 22, 8, 7, C.leaf], [34, 18, 8, 8, C.leafLight], [22, 10, 7, 9, C.leaf], [6, 38, 6, 5, C.leafDark], [40, 36, 6, 6, C.leaf], [26, 32, 7, 6, C.leafLight]]) {
      leaf(x, cx, cy, rx, ry, col)
      // the cut-outs in a monstera leaf
      P(x, cx - 2, cy - 2, C.wall)
      P(x, cx + 2, cy + 2, C.wall)
    }
    panel(x, 8, 52, 30, H - 52, C.mustard, 1.1, 0.8)
    for (let y = 55; y < H - 2; y += 3) for (let i = 10 + (y % 2) * 2; i < 36; i += 4) R(x, i, y, 2, 1, C.mustardShade)
    R(x, 6, 52, 34, 3, C.mustardShade)
  })
  add('plant-tall', 30, 88, (x, W, H) => {
    for (const [bx, top, w, col] of [[6, 10, 5, C.leaf], [12, 0, 6, C.leafDark], [19, 14, 5, C.leaf], [9, 24, 4, C.leafLight], [17, 28, 4, C.leafLight]]) {
      fillPoly(x, [[bx, 68], [bx + w, 68], [bx + w / 2, top]], col)
      for (let y = top + 6; y < 66; y += 6) P(x, bx + Math.round(w / 2), y, C.leafLight)
    }
    panel(x, 4, 66, 22, H - 66, C.cream, 1.05, 0.85)
    R(x, 4, 70, 22, 2, C.teal)
  })
  add('plant-hanging', 32, 44, (x) => {
    L(x, 16, 0, 8, 14, C.cream)
    L(x, 16, 0, 24, 14, C.cream)
    L(x, 16, 0, 16, 14, C.cream)
    panel(x, 7, 14, 18, 10, C.paper)
    R(x, 7, 17, 18, 1, C.creamShade)
    for (let k = 0; k < 6; k++) {
      leaf(x, 6 + (k % 2), 24 + k * 3, 2, 2, k % 2 ? C.leaf : C.leafDark)
      leaf(x, 26 - (k % 2), 26 + k * 3, 2, 2, k % 2 ? C.leafLight : C.leaf)
    }
    leaf(x, 12, 12, 3, 3, C.leaf)
    leaf(x, 20, 12, 3, 3, C.leafLight)
  })
  add('mirror', 28, 64, (x, W, H) => {
    RR(x, 0, 0, W, H, 10, C.wood)
    RR(x, 3, 3, W - 6, H - 6, 8, C.blueLight)
    for (let k = 0; k < 10; k++) { P(x, 8 + k, 30 - k, C.paper); P(x, 12 + k, 38 - k, C.paper) }
    R(x, 4, H - 6, W - 8, 2, C.blue)
  })
  add('laundry-basket', 34, 30, (x, W, H) => {
    E(x, 10, 6, 6, 4, C.pink)
    E(x, 22, 5, 7, 4, C.blueLight)
    panel(x, 1, 6, W - 2, H - 6, C.cream, 1.05, 0.82)
    for (let y = 9; y < H - 2; y += 3) for (let i = 3 + (y % 2) * 2; i < W - 3; i += 4) R(x, i, y, 2, 1, C.creamShade)
    R(x, 0, 6, W, 2, C.creamShade)
  })
  add('slippers', 22, 6, (x) => {
    RR(x, 0, 1, 10, 5, 2, C.pink)
    RR(x, 12, 0, 10, 5, 2, C.pink)
    R(x, 1, 2, 4, 2, C.pinkLight)
    R(x, 13, 1, 4, 2, C.pinkLight)
  })

  // ================================================================ the furniture library
  // Pieces the reader buys in the Shop and puts in the room (src/buildings/house/furniture.js
  // lists them). Same helpers, palette and outline as the room itself.

  // ---------------------------------------------------------------- wall art
  // a poster held up by two strips of tape at its top corners
  const taped = (x, W, col) => { for (const tx of [1, W - 6]) R(x, tx, 0, 5, 3, col) }

  add('poster-mountain', 34, 46, (x, W, H) => {
    panel(x, 0, 0, W, H, C.paper, 1, 0.9)
    // a sunset sky in bands, the sun sinking behind the peaks
    const sky = [C.pinkLight, C.pink, C.mustard]
    for (let k = 0; k < 3; k++) R(x, 3, 3 + k * 7, W - 6, 7, sky[k])
    E(x, 22, 16, 5, 5, C.gold)
    // the far range, then the near one with snow on its peaks
    fillPoly(x, [[3, 30], [9, 19], [14, 25], [21, 15], [27, 23], [W - 3, 19], [W - 3, 30]], C.blueShade)
    fillPoly(x, [[3, 33], [11, 21], [18, 30], [24, 22], [W - 3, 33]], C.slate)
    fillPoly(x, [[11, 21], [13, 24], [9, 24]], C.paper)
    fillPoly(x, [[24, 22], [26, 25], [22, 25]], C.paper)
    R(x, 3, 30, W - 6, 4, C.sageShade)
    // its title, in two lines of print
    R(x, 7, H - 9, W - 14, 2, C.slate)
    R(x, 11, H - 5, W - 22, 1, C.greyShade)
    taped(x, W, C.sageLight)
  })

  add('poster-moon', 34, 46, (x, W, H) => {
    panel(x, 0, 0, W, H, C.paper, 1, 0.9)
    R(x, 3, 3, W - 6, H - 14, C.slate)
    for (const [sx, sy] of [[6, 6], [27, 7], [9, 16], [29, 20], [5, 26], [18, 5]]) P(x, sx, sy, C.paper)
    P(x, 24, 27, C.gold)
    // a big full moon, its seas in shade
    E(x, 17, 16, 8, 8, C.cream)
    E(x, 14, 13, 2, 2, C.creamShade)
    E(x, 20, 19, 3, 2, C.creamShade)
    P(x, 19, 12, C.creamShade)
    // the town's rooftops along the bottom, one window lit
    fillPoly(x, [[3, H - 11], [3, 31], [8, 27], [13, 31], [13, 29], [19, 25], [25, 29], [25, 31], [W - 3, 28], [W - 3, H - 11]], C.brownDeep)
    R(x, 20, 30, 2, 2, C.windowGlow)
    R(x, 7, H - 9, W - 14, 2, C.slate)
    R(x, 11, H - 5, W - 22, 1, C.greyShade)
    taped(x, W, C.pinkLight)
  })
  add('poster-book-club', 32, 44, (x, W, H) => {
    panel(x, 0, 0, W, H, C.mustard, 1.08, 0.86)
    R(x, 3, 3, W - 6, H - 6, C.gold)
    // the club's name in a red band
    R(x, 3, 5, W - 6, 6, C.red)
    for (let i = 6; i < W - 6; i += 3) R(x, i, 7, 2, 2, C.paper)
    // an open book, its pages fanned
    fillPoly(x, [[5, 30], [15, 27], [15, 16], [5, 19]], C.paper)
    fillPoly(x, [[W - 5, 30], [W - 15, 27], [W - 15, 16], [W - 5, 19]], C.paper)
    R(x, 15, 16, 2, 12, C.paperShade)
    for (let k = 0; k < 3; k++) { L(x, 7, 21 + k * 3, 13, 19 + k * 3, C.greyShade); L(x, W - 7, 21 + k * 3, W - 13, 19 + k * 3, C.greyShade) }
    R(x, 5, 30, W - 10, 2, C.rose)
    // a heart over it, and when they meet
    E(x, 14, 13, 1, 1, C.pink)
    E(x, 17, 13, 1, 1, C.pink)
    fillPoly(x, [[12, 13], [19, 13], [15, 17]], C.pink)
    R(x, 7, H - 9, W - 14, 2, C.brown)
    R(x, 10, H - 6, W - 20, 1, C.mustardShade)
    taped(x, W, C.sageLight)
  })
  add('frame-botanical', 28, 36, (x, W, H) => framed(x, W, H, C.woodLight, (x2, X, Y, w, h) => {
    R(x2, X, Y, w, h, C.paper)
    // a pressed stem: leaves up both sides and a flower at the top
    const mid = X + (w >> 1)
    R(x2, mid, Y + 6, 1, h - 7, C.leafDark)
    for (let k = 0; k < 3; k++) {
      leaf(x2, mid - 4, Y + 10 + k * 5, 3, 2, k % 2 ? C.leaf : C.leafLight)
      leaf(x2, mid + 4, Y + 12 + k * 5, 3, 2, k % 2 ? C.leafLight : C.leaf)
    }
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) E(x2, mid + dx, Y + 4 + dy, 1, 1, C.pink)
    P(x2, mid, Y + 4, C.gold)
    R(x2, X + 3, Y + h - 2, w - 6, 1, C.greyShade)
  }))
  add('frame-gold', 30, 26, (x, W, H) => {
    // an ornate gold frame, beads at its corners, round a portrait of a ginger cat
    panel(x, 0, 0, W, H, C.mustard, 1.15, 0.8)
    R(x, 2, 2, W - 4, H - 4, C.gold)
    for (const [bx, by] of [[1, 1], [W - 3, 1], [1, H - 3], [W - 3, H - 3]]) R(x, bx, by, 2, 2, C.lampLit)
    R(x, 4, 4, W - 8, H - 8, C.sageLight)
    R(x, 4, H - 8, W - 8, 4, C.sage)
    const cx = W >> 1
    E(x, cx, H - 7, 6, 4, C.pink)
    E(x, cx, 11, 5, 4, C.pink)
    fillPoly(x, [[cx - 5, 9], [cx - 4, 4], [cx - 1, 8]], C.pink)
    fillPoly(x, [[cx + 5, 9], [cx + 4, 4], [cx + 1, 8]], C.pink)
    P(x, cx - 2, 11, C.brownDeep)
    P(x, cx + 2, 11, C.brownDeep)
    P(x, cx, 13, C.pinkShade)
    R(x, cx - 4, 9, 2, 1, C.pinkShade)
    R(x, cx + 3, 9, 2, 1, C.pinkShade)
  })

  // ---------------------------------------------------------------- plants
  // a monstera leaf: a big round leaf with slits cut in from its edge (the outline goes round them)
  const splitLeaf = (x, cx, cy, r, col, side) => {
    E(x, cx, cy, r, r - 1, col)
    R(x, cx - r + 2, cy, 2 * r - 3, 1, shade(col, 0.8))
    for (const dy of [-r + 3, r - 3]) x.clearRect(side > 0 ? cx + r - 4 : cx - r, cy + dy - 1, 5, 3)
  }

  add('plant-monstera', 46, 72, (x, W, H) => {
    for (const [ex, ey] of [[9, 20], [36, 14], [23, 8], [7, 40], [40, 34]]) L(x, 23, 50, ex, ey, C.leafDark)
    splitLeaf(x, 9, 20, 8, C.leaf, -1)
    splitLeaf(x, 36, 14, 8, C.leafLight, 1)
    splitLeaf(x, 23, 9, 8, C.leaf, 1)
    splitLeaf(x, 8, 39, 6, C.leafDark, -1)
    splitLeaf(x, 39, 34, 6, C.leaf, 1)
    // a woven basket, cream with rose bands
    panel(x, 9, 50, 28, H - 50, C.cream, 1.05, 0.82)
    for (let y = 53; y < H - 2; y += 3) for (let i = 11 + (y % 2) * 2; i < 35; i += 4) R(x, i, y, 2, 1, C.creamShade)
    R(x, 9, 56, 28, 2, C.rose)
    R(x, 9, H - 6, 28, 2, C.rose)
    R(x, 7, 50, 32, 3, C.creamShade)
  })
  add('plant-fig', 34, 90, (x, W, H) => {
    // a thin trunk up to a crown of big, round fiddle leaves
    R(x, 16, 30, 2, 44, C.woodShade)
    L(x, 17, 50, 9, 40, C.woodShade)
    L(x, 17, 40, 26, 32, C.woodShade)
    for (const [cx, cy, col] of [[17, 6, C.leaf], [9, 14, C.leafLight], [25, 12, C.leaf], [6, 26, C.leafDark], [28, 24, C.leafLight], [17, 20, C.leafDark], [11, 38, C.leaf], [26, 33, C.leafDark], [17, 30, C.leafLight]]) {
      E(x, cx, cy, 5, 6, col)
      R(x, cx, cy - 4, 1, 8, shade(col, 0.78))
    }
    // a terracotta pot with a rim
    fillPoly(x, [[7, 74], [27, 74], [25, H - 1], [9, H - 1]], C.pinkShade)
    R(x, 5, 72, 24, 4, C.pink)
    R(x, 5, 72, 24, 1, C.pinkLight)
    R(x, 10, 80, 2, 8, C.pink)
  })
  add('plant-succulents', 32, 20, (x, W, H) => {
    // three little pots: a rosette, a cactus and a trailing one
    panel(x, 0, 11, 9, 9, C.cream, 1.05, 0.85)
    for (const [dx, dy, col] of [[-3, 0, C.sage], [3, 0, C.sage], [0, -2, C.sageLight], [-1, 1, C.sageShade], [1, 1, C.sageShade]]) E(x, 4 + dx, 9 + dy, 2, 2, col)
    P(x, 4, 7, C.pinkLight)
    panel(x, 11, 12, 9, 8, C.sage, 1.08, 0.85)
    RR(x, 13, 1, 5, 12, 2, C.leaf)
    R(x, 15, 2, 1, 10, C.leafDark)
    RR(x, 10, 5, 3, 5, 1, C.leaf)
    P(x, 15, 0, C.pink)
    panel(x, 22, 11, 9, 9, C.pinkLight, 1.05, 0.85)
    for (let k = 0; k < 4; k++) { E(x, 24 + k * 2, 9 - (k % 2), 1, 1, C.leafLight); P(x, 30, 13 + k * 2, C.leaf) }
  })

  // ---------------------------------------------------------------- reading chairs
  // Each one stands where the armchair stands (about its size), so the reading nook stays put.
  add('chair-wingback', 100, 116, (x, W, H) => {
    const body = C.rose
    const back = [[16, 12], [24, 2], [76, 2], [84, 12], [84, 74], [16, 74]]
    fillPoly(x, back, body)
    // channel tufting: soft upright seams down the back
    for (let i = 26; i < 76; i += 10) R(x, i, 6, 1, 62, shade(body, 0.86))
    R(x, 24, 3, 52, 1, shade(body, 1.12))
    // tall wings, flaring out
    fillPoly(x, [[4, 22], [12, 10], [22, 12], [22, 70], [4, 70]], shade(body, 0.9))
    fillPoly(x, [[96, 22], [88, 10], [78, 12], [78, 70], [96, 70]], shade(body, 0.9))
    R(x, 6, 22, 1, 46, shade(body, 1.08))
    // a cushion at the small of the back
    RR(x, 34, 50, 32, 14, 4, C.mustard)
    R(x, 36, 51, 28, 1, C.gold)
    R(x, 49, 52, 2, 10, C.mustardShade)
    // seat and its front
    RR(x, 18, 66, 64, 12, 3, C.pinkShade)
    R(x, 20, 67, 60, 1, shade(C.pinkShade, 1.1))
    R(x, 16, 76, 68, 18, shade(body, 0.88))
    // square arms
    for (const ax of [2, 78]) {
      panel(x, ax, 58, 20, 38, body, 1.1, 0.82)
      R(x, ax + 2, 60, 16, 1, shade(body, 1.15))
    }
    // a skirt of piping, then tapered wooden legs
    R(x, 4, 94, 92, 6, shade(body, 0.8))
    for (const lx of [10, 84]) fillPoly(x, [[lx, 100], [lx + 6, 100], [lx + 5, H - 1], [lx + 2, H - 1]], C.woodDark)
  })

  add('chair-rocking', 96, 112, (x, W, H) => {
    // a spindle back between two turned posts, a cushion, and curved rockers
    const rocker = (i) => { const t = (i - W / 2) / (W / 2); return Math.round(H - 12 + 8 * (1 - t * t)) }
    for (const px of [14, 76]) {
      panel(x, px, 4, 6, rocker(px + 3) - 4, C.wood, 1.12, 0.82)
      E(x, px + 2, 4, 4, 3, C.woodLight)
    }
    panel(x, 14, 6, 68, 8, C.wood, 1.12, 0.82)
    R(x, 18, 6, 60, 1, C.woodLight)
    for (let i = 26; i < 74; i += 8) panel(x, i, 14, 3, 50, C.woodLight, 1.1, 0.85)
    panel(x, 18, 46, 60, 4, C.wood, 1.1, 0.82)
    // a cushion tied to the back, and the seat's own
    RR(x, 24, 26, 48, 22, 5, C.blueLight)
    for (const [bx, by] of [[36, 36], [48, 36], [60, 36]]) P(x, bx, by, C.blueShade)
    R(x, 26, 27, 44, 1, shade(C.blueLight, 1.1))
    panel(x, 10, 64, 76, 8, C.wood, 1.1, 0.8)
    RR(x, 14, 58, 68, 8, 3, C.blue)
    R(x, 16, 59, 64, 1, C.blueLight)
    // the arms, from the back posts to the front legs
    // the rockers: a long shallow curve under everything, lowest in the middle
    for (const ax of [6, 80]) {
      panel(x, ax, 44, 10, 5, C.woodShade, 1.1, 0.8)
      panel(x, ax + 2, 49, 5, rocker(ax + 4) - 49, C.wood, 1.12, 0.82)
    }
    R(x, 16, 72, 4, rocker(18) - 72, C.woodShade)
    R(x, 76, 72, 4, rocker(78) - 72, C.woodShade)
    for (let i = 0; i < W; i++) {
      const y = rocker(i)
      R(x, i, y, 1, 4, C.woodDark)
      P(x, i, y, C.wood)
    }
  })

  add('chair-papasan', 108, 98, (x, W, H) => {
    // a deep round rattan bowl tipped back, a fat round cushion in it, on a woven ring stand
    fillPoly(x, [[28, 72], [80, 72], [72, H - 1], [36, H - 1]], C.mustardShade)
    for (let y = 75; y < H - 2; y += 3) for (let i = 32 + (y % 2) * 2; i < 76; i += 4) R(x, i, y, 2, 1, C.mustard)
    R(x, 26, 70, 56, 3, C.woodShade)
    E(x, 54, 42, 53, 36, C.mustard)
    // the weave: rings round the bowl, crossed by its ribs
    for (const r of [52, 46, 40]) for (let a = 0; a < 360; a += 4) {
      const t = (a * Math.PI) / 180
      P(x, Math.round(54 + Math.cos(t) * r), Math.round(42 + Math.sin(t) * r * 0.68), C.mustardShade)
    }
    for (let a = 0; a < 360; a += 20) {
      const t = (a * Math.PI) / 180
      L(x, 54 + Math.cos(t) * 30, 42 + Math.sin(t) * 20, 54 + Math.cos(t) * 52, 42 + Math.sin(t) * 35, C.mustardShade)
    }
    E(x, 54, 46, 40, 26, C.teal)
    E(x, 54, 44, 36, 21, shade(C.teal, 1.08))
    // buttons round the cushion, and one in the middle
    for (let a = 0; a < 360; a += 45) {
      const t = (a * Math.PI) / 180
      R(x, Math.round(54 + Math.cos(t) * 22), Math.round(45 + Math.sin(t) * 13), 2, 2, C.tealShade)
    }
    R(x, 53, 44, 2, 2, C.tealShade)
    E(x, 28, 36, 8, 5, shade(C.teal, 1.14))
  })

  // ---------------------------------------------------------------- cats
  // Each cat is one sheet of four frames side by side, facing right (the room flips them to walk
  // left): two steps of a walk, sitting, and curled up asleep. Every frame sits in its own
  // CAT.w-wide cell with room round it, so the outlines never touch.
  const CAT = { w: 32, h: 18, frames: ['walk', 'step', 'sit', 'sleep'] }
  // f: fur, s: its shade, b: belly and chest, e: eyes, marks(x, ox, frame): stripes or patches
  const drawCat = (x, ox, frame, f) => {
    const ears = (hx, hy) => {
      fillPoly(x, [[hx - 3, hy - 1], [hx - 2, hy - 5], [hx, hy - 2]], f.f)
      fillPoly(x, [[hx + 1, hy - 2], [hx + 3, hy - 5], [hx + 4, hy - 1]], f.f)
      P(x, hx - 2, hy - 3, C.pinkShade)
      P(x, hx + 3, hy - 3, C.pinkShade)
    }
    if (frame === 'walk' || frame === 'step') {
      // the tail up behind, the body, four legs mid-stride (or passing), the head forward
      L(x, ox + 7, 8, ox + 4, 4, f.f)
      L(x, ox + 6, 8, ox + 3, 4, f.f)
      L(x, ox + 4, 4, ox + 5, 1, f.f)
      const legs = frame === 'walk' ? [[ox + 7, -1], [ox + 11, 1], [ox + 18, -1], [ox + 22, 1]] : [[ox + 9, 0], [ox + 10, 0], [ox + 20, 0], [ox + 21, 0]]
      for (const [lx, lean] of legs) {
        R(x, lx, 12, 2, 4, f.s)
        R(x, lx + lean, 16, 2, 2, f.s)
      }
      RR(x, ox + 6, 6, 18, 8, 3, f.f)
      R(x, ox + 9, 12, 12, 2, f.b)
      E(x, ox + 25, 7, 4, 4, f.f)
      ears(ox + 25, 4)
      R(x, ox + 26, 9, 3, 2, f.b)
      P(x, ox + 27, 6, f.e)
      P(x, ox + 29, 8, C.pinkShade)
    } else if (frame === 'sit') {
      // sitting up side on, the tail curled round its feet
      R(x, ox + 6, 16, 12, 2, f.f)
      P(x, ox + 6, 15, f.f)
      E(x, ox + 13, 12, 6, 6, f.f)
      RR(x, ox + 15, 6, 7, 10, 3, f.f)
      R(x, ox + 18, 9, 4, 6, f.b)
      R(x, ox + 18, 12, 2, 6, f.s)
      R(x, ox + 21, 12, 2, 6, f.s)
      E(x, ox + 21, 5, 4, 4, f.f)
      ears(ox + 21, 2)
      R(x, ox + 22, 7, 3, 2, f.b)
      P(x, ox + 23, 4, f.e)
      P(x, ox + 25, 6, C.pinkShade)
    } else {
      // asleep: a round loaf, head tucked in, tail wrapped round, eyes shut
      E(x, ox + 15, 13, 10, 5, f.f)
      R(x, ox + 7, 16, 18, 2, f.s)
      E(x, ox + 24, 13, 4, 4, f.f)
      ears(ox + 24, 10)
      R(x, ox + 25, 13, 2, 1, f.e === C.gold ? C.slate : C.brownDeep)
      R(x, ox + 24, 15, 3, 2, f.b)
    }
    f.marks?.(x, ox, frame)
  }
  const catSheet = (id, f) =>
    add(id, CAT.w * CAT.frames.length, CAT.h, (x) => CAT.frames.forEach((frame, k) => drawCat(x, k * CAT.w, frame, f)), {
      cell: { w: CAT.w, h: CAT.h + 2 },
      frames: CAT.frames,
    })

  catSheet('cat-ginger', {
    f: C.mustard, s: C.mustardShade, b: C.cream, e: C.leafDark,
    // tabby stripes across its back and on its head
    marks: (x, ox, frame) => {
      if (frame === 'walk' || frame === 'step') {
        for (const i of [9, 13, 17, 21]) R(x, ox + i, 6, 1, 4, C.mustardShade)
        P(x, ox + 25, 3, C.mustardShade)
      } else if (frame === 'sit') {
        for (const i of [9, 12, 15]) R(x, ox + i, 8, 1, 3, C.mustardShade)
      } else for (const i of [10, 14, 18]) R(x, ox + i, 9, 1, 3, C.mustardShade)
    },
  })
  catSheet('cat-black', { f: C.brownDeep, s: C.outline, b: C.brown, e: C.gold })
  catSheet('cat-calico', {
    f: C.cream, s: C.creamShade, b: C.paper, e: C.leafDark,
    // patches of orange and brown
    marks: (x, ox, frame) => {
      if (frame === 'walk' || frame === 'step') {
        E(x, ox + 11, 8, 3, 2, C.mustard)
        E(x, ox + 18, 7, 2, 2, C.brown)
        P(x, ox + 24, 4, C.brown)
        P(x, ox + 25, 5, C.mustard)
      } else if (frame === 'sit') {
        E(x, ox + 12, 10, 3, 3, C.mustard)
        E(x, ox + 21, 3, 2, 1, C.brown)
      } else {
        E(x, ox + 12, 11, 3, 2, C.mustard)
        E(x, ox + 18, 12, 2, 2, C.brown)
      }
    },
  })

  return { sprites: out.map(({ id, spr, meta }) => ({ id, w: spr.width, h: spr.height, meta, png: spr.toDataURL('image/png') })) }
