  // ---------------------------------------------------------------- avatars (28 x 56)
  // The characters, front view, drawn pixel by pixel. Habbo-style: big head, dark outline.
  // The first five can be picked in the salon; the rest are townsfolk who walk around town.
  // Only the first five use rnd(): anything after them must not, or the town map changes.
  function avatar(p) {
    const [c, x] = mk(28, 56)
    const dark = '#2b2230'

    // hair behind the body
    if (p.hair === 'messy' || p.hair === 'bob') {
      R(x, 5, 6, 18, p.hair === 'bob' ? 15 : 17, p.hairC)
      R(x, 21, 8, 2, p.hair === 'bob' ? 13 : 15, p.hairS)
    }
    if (p.hair === 'wavy') {
      R(x, 4, 7, 20, 34, p.hairC)
      R(x, 22, 9, 2, 32, p.hairS)
      for (let yy = 12; yy < 40; yy += 4) {
        P(x, 4, yy, p.hairS)
        P(x, 5, yy + 1, p.hairS)
        P(x, 23, yy + 2, shade(p.hairS, 0.85))
      }
    }
    if (p.hair === 'mop') {
      E(x, 14, 11, 12, 11, p.hairC)
      for (let i = 0; i < 30; i++) P(x, 3 + ((i * 7) % 22), 2 + ((i * 5) % 19), p.hairS)
    }
    if (p.hair === 'long') {
      R(x, 4, 7, 20, 32, p.hairC)
      R(x, 5, 38, 18, 2, p.hairC)
      R(x, 22, 9, 2, 30, p.hairS)
    }
    if (p.hair === 'curly') {
      E(x, 14, 11, 12, 10, p.hairC)
      for (let k = 0; k < 40; k++) P(x, 3 + Math.floor(rnd() * 22), 2 + Math.floor(rnd() * 18), p.hairS)
    }
    if (p.hair === 'puff') E(x, 14, 9, 11, 8, p.hairC)

    // legs and bottoms
    const legTop = 38
    if (p.bottom === 'skirt') {
      R(x, 10, 43, 3, 7, p.sock)
      R(x, 15, 43, 3, 7, p.sock)
      R(x, 10, 43, 3, 1, p.skinS)
      R(x, 15, 43, 3, 1, p.skinS)
      R(x, 8, 36, 12, 4, p.botC)
      R(x, 7, 40, 14, 3, p.botC)
      R(x, 7, 42, 14, 1, p.botS)
      for (let i = 8; i < 21; i += 3) P(x, i, 41, p.botS)
    } else if (p.bottom === 'long') {
      // a long skirt down to the ankles
      R(x, 8, 36, 12, 14, p.botC)
      R(x, 18, 36, 2, 14, p.botS)
      R(x, 8, 49, 12, 1, p.botS)
      R(x, 13, 40, 1, 9, p.botS)
    } else {
      const baggy = p.bottom === 'baggy' || p.bottom === 'cargo'
      R(x, baggy ? 8 : 9, legTop, baggy ? 6 : 5, 12, p.botC)
      R(x, 14, legTop, baggy ? 6 : 5, 12, p.botS)
      R(x, 13, legTop + 3, 1, 9, p.botS)
      if (baggy) {
        R(x, 8, 46, 6, 1, p.botS)
        R(x, 14, 45, 6, 1, shade(p.botS, 0.85))
      }
      if (p.bottom === 'ripped') {
        R(x, 10, 42, 3, 2, '#c9d9e6')
        P(x, 11, 43, p.skin)
        R(x, 15, 45, 3, 2, '#c9d9e6')
        E(x, 16, 41, 1, 1, '#d0453d')
      }
      if (p.bottom === 'cargo') {
        R(x, 8, 42, 2, 3, p.botS)
        R(x, 18, 41, 2, 3, shade(p.botS, 0.85))
      }
    }
    // shoes, or boots up the shin
    if (p.boots) {
      R(x, 8, 46, 6, 5, p.shoe)
      R(x, 14, 46, 6, 5, shade(p.shoe, 0.85))
      P(x, 10, 47, shade(p.shoe, 1.3))
      P(x, 16, 47, shade(p.shoe, 1.2))
    }
    R(x, 8, 50, 6, 3, p.shoe)
    R(x, 14, 50, 6, 3, p.shoe)
    R(x, 8, 52, 6, 1, p.sole)
    R(x, 14, 52, 6, 1, p.sole)
    P(x, 9, 50, shade(p.shoe, 1.3))
    P(x, 15, 50, shade(p.shoe, 1.3))

    // body and arms
    const puffy = p.top === 'puffer' || p.top === 'fuzzy'
    const tx = puffy ? 7 : 8
    const tw = puffy ? 14 : 12
    const long = p.top === 'coat'
    R(x, tx, 24, tw, long ? 20 : 14, p.topC)
    R(x, tx + tw - 2, 24, 2, long ? 20 : 14, p.topS)
    const ax = puffy ? 3 : 5
    const aw = puffy ? 4 : 3
    const bare = p.top === 'tank' || p.top === 'tube'
    const sleeve = bare ? p.skin : p.sleeve ?? p.topC
    R(x, ax, 25, aw, 12, sleeve)
    R(x, 28 - ax - aw, 25, aw, 12, bare ? p.skinS : shade(sleeve, 0.82))
    if (p.shortSleeves) {
      R(x, ax, 31, aw, 6, p.skin)
      R(x, 28 - ax - aw, 31, aw, 6, p.skinS)
    }
    R(x, ax, 37, aw, 2, p.skin)
    R(x, 28 - ax - aw, 37, aw, 2, p.skinS)
    if (p.top === 'puffer') {
      for (let yy = 27; yy < 38; yy += 3) {
        R(x, tx, yy, tw, 1, p.topS)
        R(x, ax, yy, aw * 1, 1, p.topS)
        R(x, 28 - ax - aw, yy, aw, 1, shade(p.topS, 0.85))
      }
      R(x, 12, 24, 4, 9, p.inner)
      R(x, 10, 23, 8, 2, p.topC)
    }
    if (p.top === 'fuzzy') {
      for (let k = 0; k < 70; k++) {
        const px = tx + Math.floor(rnd() * tw)
        const py = 24 + Math.floor(rnd() * 14)
        P(x, px, py, rnd() < 0.5 ? p.topS : shade(p.topC, 1.12))
      }
      for (let k = 0; k < 24; k++) P(x, ax + Math.floor(rnd() * aw), 25 + Math.floor(rnd() * 12), p.topS)
      R(x, 13, 24, 2, 14, p.topS)
    }
    if (p.top === 'coat') {
      R(x, 11, 24, 6, 13, p.inner)
      R(x, 10, 24, 1, 20, p.topS)
      R(x, 17, 24, 1, 20, p.topS)
      P(x, 13, 27, dark)
      P(x, 14, 27, dark)
      R(x, 12, 30, 4, 1, '#3a3a48')
    }
    if (p.top === 'pinafore') {
      R(x, 9, 26, 10, 12, p.topC)
      R(x, 11, 24, 6, 2, p.inner)
      R(x, 13, 26, 2, 2, p.inner)
      R(x, 17, 26, 2, 12, p.topS)
      // argyle sleeve
      for (let yy = 27; yy < 36; yy += 3) {
        P(x, 6, yy, '#e3b04b')
        P(x, 5, yy + 1, '#c0567a')
        P(x, 7, yy + 1, '#c0567a')
      }
    }
    if (p.top === 'tank') {
      R(x, 8, 24, 2, 3, p.skin)
      R(x, 18, 24, 2, 3, p.skinS)
      R(x, 11, 24, 6, 2, p.skin)
      R(x, 10, 24, 1, 3, p.topS)
      R(x, 17, 24, 1, 3, p.topS)
      R(x, 8, 36, 12, 1, p.topS)
    }
    if (p.top === 'tube') {
      R(x, 8, 24, 12, 3, p.skin)
      R(x, 18, 24, 2, 3, p.skinS)
      R(x, 8, 27, 12, 1, shade(p.topC, 1.12))
      R(x, 8, 33, 12, 1, p.topS)
    }
    if (p.top === 'hoodie') {
      R(x, 10, 32, 8, 4, shade(p.topC, 0.85))
      R(x, 10, 32, 8, 1, p.topS)
      R(x, 12, 25, 1, 4, '#d9d0c4')
      R(x, 15, 25, 1, 4, '#d9d0c4')
    }
    if (p.print) {
      R(x, 11, 28, 6, 5, p.print)
      R(x, 12, 29, 2, 2, shade(p.print, 1.25))
      P(x, 15, 31, shade(p.print, 0.75))
    }
    if (p.top === 'vest') {
      for (let yy = 27; yy < 38; yy += 3) for (let xx = 9; xx < 19; xx += 4) P(x, xx + (yy % 2), yy, p.topS)
      fillPoly(x, [[10, 24], [18, 24], [14, 30]], p.inner)
      R(x, 13, 24, 2, 6, '#2b3a5a')
      P(x, 13, 24, '#3d5280')
    }
    if (p.pattern) {
      // a flame across the chest
      for (let xx = 8; xx < 20; xx++) {
        const h = 2 + ((xx * 3) % 4)
        R(x, xx, 33 - h, 1, h + 2, p.pattern)
        P(x, xx, 33 - h, shade(p.pattern, 1.25))
      }
    }
    if (p.top === 'cardigan') {
      R(x, 11, 24, 6, 14, p.inner)
      R(x, 10, 24, 1, 14, p.topS)
      R(x, 17, 24, 1, 14, p.topS)
      for (const [fx, fy] of [[12, 29], [15, 32], [13, 35]]) P(x, fx, fy, '#f2a0b8')
    }
    if (p.top === 'blazer') {
      for (let xx = 8; xx < 20; xx += 2) R(x, xx, 24, 1, 14, p.topS)
      for (let xx = 0; xx < 3; xx += 2) {
        R(x, 5 + xx, 25, 1, 12, p.topS)
        R(x, 20 + xx, 25, 1, 12, p.topS)
      }
      R(x, 11, 24, 6, 10, p.inner)
      R(x, 10, 24, 1, 12, dark)
      R(x, 17, 24, 1, 12, dark)
      R(x, 11, 24, 6, 2, '#8a8a8a')
      P(x, 13, 24, '#5a5a5a')
      P(x, 14, 24, '#5a5a5a')
    }
    if (p.bag) {
      // a tote bag on the shoulder
      R(x, 19, 24, 1, 8, shade(p.bag, 0.7))
      R(x, 17, 31, 9, 9, p.bag)
      for (let yy = 32; yy < 40; yy += 2) R(x, 17, yy, 9, 1, shade(p.bag, 0.88))
      R(x, 24, 31, 2, 9, shade(p.bag, 0.8))
    }
    if (p.scarf) {
      R(x, 9, 22, 10, 3, p.scarf)
      R(x, 16, 24, 3, 6, p.scarf)
      R(x, 16, 29, 3, 1, shade(p.scarf, 0.8))
    }

    // a hood bunched up round the head
    if (p.hood) {
      E(x, 14, 13, 10, 11, p.hood)
      R(x, 21, 9, 2, 13, shade(p.hood, 0.8))
    }

    // neck and head
    R(x, 12, 21, 4, 3, p.skinS)
    R(x, 9, 5, 10, 1, p.skin)
    R(x, 8, 6, 12, 1, p.skin)
    R(x, 7, 7, 14, 13, p.skin)
    R(x, 8, 20, 12, 1, p.skin)
    R(x, 9, 21, 10, 1, p.skin)
    R(x, 20, 8, 1, 12, p.skinS)
    R(x, 9, 21, 10, 1, p.skinS)
    R(x, 6, 12, 1, 3, p.skin)
    R(x, 21, 12, 1, 3, p.skinS)

    // face
    R(x, 9, 11, 3, 1, dark)
    R(x, 16, 11, 3, 1, dark)
    R(x, 10, 12, 2, 2, dark)
    R(x, 16, 12, 2, 2, dark)
    P(x, 10, 12, '#ffffff')
    P(x, 16, 12, '#ffffff')
    R(x, 10, 9, 2, 1, p.brow ?? p.hairS)
    R(x, 16, 9, 2, 1, p.brow ?? p.hairS)
    P(x, 14, 15, p.skinS)
    R(x, 13, 17, 2, 1, p.lips)
    R(x, 8, 15, 2, 1, p.blush)
    R(x, 18, 15, 2, 1, p.blush)

    if (p.shades) {
      R(x, 8, 11, 12, 3, '#1e1a24')
      R(x, 9, 11, 3, 1, '#4a4a5a')
      R(x, 15, 11, 3, 1, '#4a4a5a')
    }
    if (p.goggles) {
      R(x, 7, 10, 14, 5, '#5a5a68')
      R(x, 8, 11, 5, 3, '#9fc4d9')
      R(x, 15, 11, 5, 3, '#9fc4d9')
      P(x, 9, 11, '#e8f7fc')
      P(x, 16, 11, '#e8f7fc')
    }

    // hair in front
    if (p.hair === 'long') {
      R(x, 9, 3, 10, 1, p.hairC)
      R(x, 7, 4, 14, 2, p.hairC)
      R(x, 6, 6, 16, 3, p.hairC)
      R(x, 6, 9, 3, 15, p.hairC)
      R(x, 19, 9, 3, 15, p.hairS)
      R(x, 9, 9, 4, 1, p.hairC)
      R(x, 15, 9, 2, 1, p.hairC)
      R(x, 10, 4, 4, 1, shade(p.hairC, 1.2))
    }
    if (p.hair === 'bun') {
      E(x, 14, 2, 3, 2, p.hairC)
      P(x, 13, 1, shade(p.hairC, 1.25))
      R(x, 8, 4, 12, 2, p.hairC)
      R(x, 7, 6, 14, 3, p.hairC)
      R(x, 6, 8, 2, 8, p.hairC)
      R(x, 20, 8, 2, 8, p.hairS)
      R(x, 8, 9, 2, 6, p.hairC)
      R(x, 10, 5, 5, 1, shade(p.hairC, 1.2))
      R(x, 18, 9, 1, 10, p.hairS)
    }
    if (p.hair === 'curly') {
      for (let i = 5; i < 23; i += 2) E(x, i, 6 + (i % 4 === 1 ? 0 : 1), 2, 2, p.hairC)
      R(x, 6, 8, 3, 10, p.hairC)
      R(x, 19, 8, 3, 10, p.hairS)
      for (let k = 0; k < 14; k++) P(x, 5 + Math.floor(rnd() * 18), 4 + Math.floor(rnd() * 5), p.hairS)
      if (p.flower) {
        R(x, 9, 3, 3, 3, p.flower)
        P(x, 10, 2, p.flower)
        P(x, 8, 4, p.flower)
        P(x, 12, 4, p.flower)
        P(x, 10, 4, '#f6e27a')
      }
    }
    if (p.hair === 'twists') {
      R(x, 8, 3, 12, 6, p.hairC)
      R(x, 7, 5, 1, 4, p.hairC)
      R(x, 20, 5, 1, 4, p.hairS)
      for (let i = 8; i < 20; i += 2) R(x, i, 3, 1, 6, p.hairS)
      R(x, 8, 8, 12, 1, p.roots)
    }
    if (p.hair === 'puff') {
      for (let i = 4; i < 25; i += 3) E(x, i, 5 + (i % 2), 2, 2, p.hairC)
      R(x, 6, 6, 16, 3, p.hairC)
      R(x, 5, 8, 3, 8, p.hairC)
      R(x, 20, 8, 3, 8, p.hairS)
      for (let k = 0; k < 30; k++) P(x, 4 + Math.floor(rnd() * 20), 2 + Math.floor(rnd() * 12), rnd() < 0.5 ? p.hairS : shade(p.hairC, 1.2))
    }
    if (p.hair === 'messy') {
      R(x, 9, 3, 10, 1, p.hairC)
      R(x, 7, 4, 14, 2, p.hairC)
      R(x, 6, 6, 16, 3, p.hairC)
      R(x, 6, 9, 3, 11, p.hairC)
      R(x, 19, 9, 3, 11, p.hairS)
      R(x, 9, 9, 3, 2, p.hairC)
      R(x, 14, 9, 2, 1, p.hairC)
      for (const [hx, hy] of [[8, 2], [12, 1], [13, 2], [17, 2], [19, 3], [5, 5], [22, 6], [5, 12], [22, 14]]) P(x, hx, hy, p.hairC)
      R(x, 10, 4, 3, 1, shade(p.hairC, 1.25))
      P(x, 15, 5, shade(p.hairC, 1.25))
    }
    if (p.hair === 'bob') {
      R(x, 8, 3, 12, 2, p.hairC)
      R(x, 6, 5, 16, 4, p.hairC)
      R(x, 5, 9, 4, 12, p.hairC)
      R(x, 19, 9, 4, 12, p.hairS)
      R(x, 9, 9, 6, 2, p.hairC)
      R(x, 15, 9, 2, 1, p.hairC)
      R(x, 10, 4, 5, 1, shade(p.hairC, 1.22))
    }
    if (p.hair === 'wavy') {
      R(x, 9, 3, 10, 1, p.hairC)
      R(x, 7, 4, 14, 2, p.hairC)
      R(x, 6, 6, 16, 3, p.hairC)
      R(x, 5, 9, 3, 17, p.hairC)
      R(x, 20, 9, 3, 17, p.hairS)
      for (let yy = 11; yy < 26; yy += 4) P(x, 7, yy, p.hairS)
      P(x, 14, 4, p.hairS)
      R(x, 9, 4, 4, 1, shade(p.hairC, 1.2))
    }
    if (p.hair === 'short') {
      R(x, 8, 3, 12, 2, p.hairC)
      R(x, 7, 5, 14, 3, p.hairC)
      R(x, 6, 7, 2, 5, p.hairC)
      R(x, 20, 7, 2, 5, p.hairS)
      R(x, 8, 8, 7, 1, p.hairC)
      for (const [hx, hy] of [[10, 4], [12, 5], [15, 4], [17, 5]]) P(x, hx, hy, shade(p.hairC, 1.6))
    }
    if (p.hair === 'spiky') {
      R(x, 7, 4, 14, 4, p.hairC)
      for (const [sx, sy] of [[6, 1], [9, 0], [12, 0], [15, 0], [18, 0], [21, 2]]) fillPoly(x, [[sx - 3, 6], [sx + 3, 6], [sx, sy]], p.hairC)
      R(x, 6, 7, 2, 5, p.hairC)
      R(x, 20, 7, 2, 5, p.hairS)
      for (const sx of [8, 11, 14, 17]) P(x, sx, 8, p.hairC)
      for (const sx of [9, 13, 17]) R(x, sx, 3, 1, 3, p.hairS)
    }
    if (p.hair === 'mop') {
      for (let i = 4; i < 25; i += 3) E(x, i, 5 + (i % 2), 2, 2, p.hairC)
      R(x, 5, 6, 18, 3, p.hairC)
      R(x, 4, 8, 4, 13, p.hairC)
      R(x, 20, 8, 4, 13, p.hairS)
      R(x, 8, 8, 2, 3, p.hairC)
      R(x, 12, 8, 2, 2, p.hairC)
      for (let i = 0; i < 16; i++) P(x, 4 + ((i * 5) % 20), 3 + ((i * 3) % 16), p.hairS)
    }
    if (p.hair === 'tucked') {
      // what shows under a hat
      R(x, 6, 7, 2, 7, p.hairC)
      R(x, 20, 7, 2, 7, p.hairS)
    }

    // things in the hair and on the head
    if (p.clip) {
      R(x, 6, 5, 5, 5, p.clip)
      R(x, 7, 4, 3, 7, p.clip)
      P(x, 8, 7, shade(p.clip, 0.75))
      P(x, 7, 5, shade(p.clip, 1.15))
    }
    if (p.crown) {
      R(x, 6, 5, 16, 1, shade(p.crown, 0.85))
      for (const sx of [7, 11, 15, 19]) {
        P(x, sx, 2, p.crown)
        R(x, sx - 1, 3, 3, 1, p.crown)
        P(x, sx, 4, p.crown)
        P(x, sx, 3, '#fff1b8')
      }
    }
    if (p.sprout) {
      R(x, 14, 1, 1, 3, '#4f8f3a')
      R(x, 11, 1, 3, 1, '#5aa045')
      R(x, 12, 0, 2, 1, '#5aa045')
      R(x, 15, 0, 3, 1, '#5aa045')
    }
    if (p.hat === 'beanie') {
      R(x, 9, 0, 10, 1, p.hatC)
      R(x, 7, 1, 14, 6, p.hatC)
      for (let xx = 8; xx < 20; xx += 2) R(x, xx, 1, 1, 5, shade(p.hatC, 0.85))
      R(x, 6, 6, 16, 3, shade(p.hatC, 0.82))
      R(x, 6, 6, 16, 1, shade(p.hatC, 1.1))
    }
    if (p.hat === 'fedora') {
      R(x, 8, 0, 12, 6, p.hatC)
      R(x, 12, 0, 4, 1, shade(p.hatC, 0.8))
      for (let xx = 9; xx < 20; xx += 3) P(x, xx, 2, shade(p.hatC, 0.85))
      R(x, 8, 4, 12, 2, p.band)
      R(x, 3, 6, 22, 2, p.hatC)
      R(x, 3, 7, 22, 1, shade(p.hatC, 0.8))
    }
    if (p.earring) {
      P(x, 6, 15, p.earring)
      R(x, 5, 16, 2, 2, p.earring)
    }
    return outline(c)
  }

  const AVATARS = [
    { name: 'Rosie', hair: 'long', hairC: '#e27aa0', hairS: '#b8547a', skin: '#f6d6bd', skinS: '#e0b796', lips: '#c0566a', blush: '#f2a0a8', top: 'pinafore', topC: '#e98aa8', topS: '#c96a88', inner: '#fdf7ec', sleeve: '#fdf7ec', bottom: 'skirt', botC: '#fdf7ec', botS: '#d9d0c4', sock: '#fdf7ec', shoe: '#e98aa8', sole: '#fdf7ec' },
    { name: 'Maya', hair: 'bun', hairC: '#6b4a34', hairS: '#4a3122', skin: '#f1c9a5', skinS: '#d9a982', lips: '#b4554f', blush: '#ebaa98', top: 'puffer', topC: '#c0392f', topS: '#8e2a22', inner: '#fdf7ec', bottom: 'baggy', botC: '#6b6e78', botS: '#53565f', shoe: '#2b2230', sole: '#fdf7ec' },
    { name: 'Rex', hair: 'curly', hairC: '#2b2630', hairS: '#4a4452', flower: '#d0453d', skin: '#f3d2b8', skinS: '#dcb294', lips: '#a8574f', blush: '#f3d2b8', shades: true, top: 'coat', topC: '#8a6448', topS: '#6b4a34', inner: '#f4efe2', bottom: 'pants', botC: '#9aa0ab', botS: '#7d838e', shoe: '#2b2230', sole: '#4a4452', brow: '#2b2630' },
    { name: 'Jay', hair: 'twists', hairC: '#e8cf8a', hairS: '#c9a95e', roots: '#3a2a20', skin: '#8a5a3c', skinS: '#6e452c', lips: '#5e3624', blush: '#8a5a3c', goggles: true, top: 'fuzzy', topC: '#f0c23a', topS: '#c99a1e', bottom: 'ripped', botC: '#8fa8bf', botS: '#7690a8', shoe: '#2b2230', sole: '#5a5a68', brow: '#3a2a20' },
    { name: 'Nova', hair: 'puff', hairC: '#c0502f', hairS: '#8e3520', skin: '#b5835c', skinS: '#966644', lips: '#7a4232', blush: '#c4876a', top: 'puffer', topC: '#2b2b33', topS: '#16161c', inner: '#5a6070', scarf: '#5a6070', bottom: 'baggy', botC: '#2b2b33', botS: '#1e1e26', shoe: '#2b2230', sole: '#fdf7ec' },
    // townsfolk
    { name: 'Theo', hair: 'none', hairC: '#3a3a48', hairS: '#2b2b33', hat: 'beanie', hatC: '#55585f', hood: '#4a4d55', skin: '#f1c9a5', skinS: '#d9a982', lips: '#b4554f', blush: '#f1c9a5', brow: '#3a3a48', top: 'hoodie', topC: '#4a4d55', topS: '#36383f', bottom: 'baggy', botC: '#6b5a3e', botS: '#54452f', shoe: '#3a2a20', sole: '#2b2230' },
    { name: 'Pip', hair: 'messy', hairC: '#6b4a34', hairS: '#4a3122', skin: '#f6d6bd', skinS: '#e0b796', lips: '#c0566a', blush: '#f2a0a8', top: 'tee', topC: '#2b2b33', topS: '#16161c', print: '#e98aa8', shortSleeves: true, bottom: 'skirt', botC: '#c9d3e0', botS: '#9fadc0', sock: '#f6d6bd', shoe: '#8a8f99', sole: '#fdf7ec' },
    { name: 'Ivy', hair: 'bob', hairC: '#b8572f', hairS: '#8e3d1e', skin: '#f6d6bd', skinS: '#e0b796', lips: '#c0566a', blush: '#f2b8a8', top: 'tank', topC: '#9cc79a', topS: '#6fa06d', bottom: 'baggy', botC: '#f0e6b8', botS: '#d6c98f', shoe: '#e8dcc0', sole: '#b9a57e' },
    { name: 'Stella', hair: 'wavy', hairC: '#b49a7a', hairS: '#8a7458', crown: '#f6c84a', earring: '#f6c84a', skin: '#e0b48e', skinS: '#c49470', lips: '#a8574f', blush: '#e88f80', top: 'tube', topC: '#f6e27a', topS: '#d9b84a', bottom: 'long', botC: '#e8e2b8', botS: '#c9c290', shoe: '#f4efe2', sole: '#b9b09d' },
    { name: 'Leo', hair: 'short', hairC: '#2b2630', hairS: '#1e1a24', skin: '#e8c0a0', skinS: '#cfa07e', lips: '#a8574f', blush: '#e8c0a0', top: 'vest', topC: '#b8402f', topS: '#8e2a22', inner: '#f2b8c0', sleeve: '#f2b8c0', bottom: 'pants', botC: '#8fa8bf', botS: '#7690a8', shoe: '#b9c9d3', sole: '#8fa0ad' },
    { name: 'Finn', hair: 'spiky', hairC: '#c9a95e', hairS: '#a8873e', skin: '#f3d9c0', skinS: '#dcb89a', lips: '#b4554f', blush: '#f3d9c0', brow: '#a8873e', top: 'sweater', topC: '#9a9ca3', topS: '#7d7f86', pattern: '#d9842f', bottom: 'pants', botC: '#8fa8bf', botS: '#7690a8', shoe: '#b9c9d3', sole: '#8fa0ad' },
    { name: 'Luna', hair: 'mop', hairC: '#2b2630', hairS: '#453f4c', clip: '#9fd4b0', skin: '#d9a06a', skinS: '#bd8450', lips: '#8a4a3a', blush: '#d9a06a', brow: '#2b2630', top: 'tank', topC: '#5e1c22', topS: '#8e2a32', bottom: 'cargo', botC: '#5a5d66', botS: '#45474f', shoe: '#d9a06a', sole: '#8e2a22' },
    { name: 'Fern', hair: 'wavy', hairC: '#b8925a', hairS: '#8a6a3a', sprout: true, skin: '#f6dcc6', skinS: '#e0bea2', lips: '#c0566a', blush: '#f2a0b8', top: 'cardigan', topC: '#f4e6a8', topS: '#d9c47a', inner: '#6b7a3a', bag: '#bcd6e2', bottom: 'skirt', botC: '#6b7a3a', botS: '#53602c', sock: '#f6dcc6', boots: true, shoe: '#8a6440', sole: '#5a3a24' },
    { name: 'Hazel', hair: 'tucked', hairC: '#d9c48a', hairS: '#b8a25e', hat: 'fedora', hatC: '#c9a46a', band: '#4a5a3a', earring: '#9fd4ee', skin: '#f6dcc6', skinS: '#e0bea2', lips: '#c0566a', blush: '#f2a0b8', top: 'blazer', topC: '#f4efe2', topS: '#2b2b33', inner: '#fdf7ec', bottom: 'skirt', botC: '#4a2a6a', botS: '#341c4e', sock: '#f6dcc6', shoe: '#e8dcc0', sole: '#2b2230' },
  ]
  const avatarSprites = AVATARS.map(avatar)

