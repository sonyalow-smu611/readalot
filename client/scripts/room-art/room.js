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

  // curtains: pleated fabric gathered by a tie-back two thirds down
  const curtain = (flip) => (x, W, H) => {
    const fx = (n) => (flip ? W - 1 - n : n)
    const tie = Math.round(H * 0.62)
    const pts = [[0, 0], [W, 0], [W, tie - 10], [W * 0.45, tie], [W * 0.75, H], [0, H]].map(([a, b]) => [fx(a), b])
    fillPoly(x, pts, C.pink)
    // pleats: darker and lighter stripes inside the curtain's outline
    polyRows(pts, (y, a, b) => {
      for (let i = a; i < b; i++) {
        const k = (flip ? W - 1 - i : i) % 6
        if (k === 0) P(x, i, y, C.pinkShade)
        else if (k === 3) P(x, i, y, C.pinkLight)
      }
    })
    // the tie-back
    R(x, fx(flip ? 13 : 0), tie - 2, 14, 4, C.mustard)
    R(x, fx(flip ? 13 : 0), tie - 2, 14, 1, C.gold)
  }
  add('curtain-left', 24, 176, curtain(false))
  add('curtain-right', 24, 176, curtain(true))
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
  const lamp = (lit) => (x, W, H) => {
    const shadeTop = 22, shadeBottom = 34
    const pts = [[(W - shadeTop) / 2, 0], [(W + shadeTop) / 2, 0], [(W + shadeBottom) / 2, 30], [(W - shadeBottom) / 2, 30]]
    fillPoly(x, pts, lit ? C.lampLit : C.lampShade)
    polyRows(pts, (y, a, b) => {
      for (let i = a; i < b; i++) if ((i - a) % 5 === 0) P(x, i, y, lit ? C.gold : C.mustard)
    })
    R(x, (W - shadeBottom) / 2, 29, shadeBottom, 1, lit ? C.windowGlow : C.mustardShade)
    if (lit) R(x, (W - shadeBottom) / 2 + 3, 26, shadeBottom - 6, 3, C.windowGlow)
    R(x, (W >> 1) - 1, 30, 2, H - 36, C.brown)
    R(x, (W >> 1) - 1, 30, 1, H - 36, C.slate)
    E(x, W >> 1, H - 4, 11, 3, C.brown)
    R(x, (W >> 1) - 10, H - 4, 20, 1, C.slate)
  }
  add('floor-lamp', 36, 152, lamp(false), { glow: { x: at(18), y: at(24) } })
  add('floor-lamp-lit', 36, 152, lamp(true), { glow: { x: at(18), y: at(24) } })

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

  // the rug's front edge along the floor, with a fringe
  add('rug', 200, 7, (x, W) => {
    R(x, 0, 0, W, 5, C.pink)
    for (let i = 0; i < W; i += 8) { R(x, i, 1, 4, 1, C.pinkLight); R(x, i + 4, 3, 4, 1, C.rose) }
    for (let i = 1; i < W; i += 3) P(x, i, 5, C.cream)
  })
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
  const tableLamp = (lit) => (x, W, H) => {
    const pts = [[6, 0], [W - 6, 0], [W - 1, 14], [0, 14]]
    fillPoly(x, pts, lit ? C.lampLit : C.mustard)
    polyRows(pts, (y, a, b) => { for (let i = a; i < b; i++) if ((i - a) % 4 === 0) P(x, i, y, lit ? C.gold : C.mustardShade) })
    if (lit) R(x, 2, 12, W - 4, 2, C.windowGlow)
    R(x, (W >> 1) - 1, 14, 2, 6, C.brown)
    E(x, W >> 1, H - 7, 6, 6, C.sage)
    R(x, (W >> 1) - 4, H - 10, 2, 4, C.sageLight)
    R(x, (W >> 1) - 5, H - 2, 10, 2, C.sageShade)
  }
  add('table-lamp', 24, 34, tableLamp(false), { glow: { x: at(12), y: at(10) } })
  add('table-lamp-lit', 24, 34, tableLamp(true), { glow: { x: at(12), y: at(10) } })

  // the bed, side on: headboard on the left, a patchwork quilt, pillows, a throw at the foot
  add('bed', 214, 90, (x, W, H) => {
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
    RR(x, 22, 18, 30, 18, 6, C.pinkLight)
    R(x, 26, 32, 22, 2, C.pink)
    // patchwork quilt, hanging over the side with a wavy hem
    const cols = [C.sage, C.pink, C.cream, C.mustard, C.blueLight, C.pinkLight, C.sageLight]
    for (let qy = 34, r = 0; qy < 66; qy += 8, r++) {
      for (let qx = 50, c = 0; qx < W - 14; qx += 12, c++) {
        const col = cols[(r * 3 + c) % cols.length]
        R(x, qx, qy, 12, 8, col)
        R(x, qx, qy, 12, 1, shade(col, 1.08))
        R(x, qx + 11, qy, 1, 8, C.paperShade)
      }
    }
    R(x, 50, 34, W - 64, 1, C.paper)
    for (let qx = 50; qx < W - 14; qx++) if (Math.floor(qx / 6) % 2) P(x, qx, 66, C.sage)
    // a folded throw at the foot
    panel(x, W - 52, 28, 36, 10, C.mustard, 1.1, 0.82)
    for (let i = W - 50; i < W - 18; i += 4) R(x, i, 30, 2, 6, C.mustardShade)
  })

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

  return { sprites: out.map(({ id, spr, meta }) => ({ id, w: spr.width, h: spr.height, meta, png: spr.toDataURL('image/png') })) }
