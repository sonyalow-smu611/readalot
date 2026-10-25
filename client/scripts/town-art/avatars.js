  // ---------------------------------------------------------------- avatars (28 x 56)
  // The five characters, front view, drawn pixel by pixel. Habbo-style: big head, dark outline.
  function avatar(p) {
    const [c, x] = mk(28, 56)
    const dark = '#2b2230'

    // hair behind the body
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
    } else {
      const baggy = p.bottom === 'baggy'
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
    }
    // shoes
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
    const sleeve = p.top === 'tank' ? p.skin : p.sleeve ?? p.topC
    R(x, ax, 25, aw, 12, sleeve)
    R(x, 28 - ax - aw, 25, aw, 12, p.top === 'tank' ? p.skinS : shade(sleeve, 0.82))
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
      R(x, 9, 24, 2, 3, p.skin)
      R(x, 17, 24, 2, 3, p.skin)
      R(x, 11, 24, 6, 2, p.skin)
      R(x, 9, 35, 10, 2, '#7a8fb0')
      R(x, 13, 35, 2, 2, '#c9c0ad')
    }
    if (p.scarf) {
      R(x, 9, 22, 10, 3, p.scarf)
      R(x, 16, 24, 3, 6, p.scarf)
      R(x, 16, 29, 3, 1, shade(p.scarf, 0.8))
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
    return outline(c)
  }

  const AVATARS = [
    { name: 'Rosie', hair: 'long', hairC: '#e27aa0', hairS: '#b8547a', skin: '#f6d6bd', skinS: '#e0b796', lips: '#c0566a', blush: '#f2a0a8', top: 'pinafore', topC: '#e98aa8', topS: '#c96a88', inner: '#fdf7ec', sleeve: '#fdf7ec', bottom: 'skirt', botC: '#fdf7ec', botS: '#d9d0c4', sock: '#fdf7ec', shoe: '#e98aa8', sole: '#fdf7ec' },
    { name: 'Maya', hair: 'bun', hairC: '#6b4a34', hairS: '#4a3122', skin: '#f1c9a5', skinS: '#d9a982', lips: '#b4554f', blush: '#ebaa98', top: 'puffer', topC: '#c0392f', topS: '#8e2a22', inner: '#fdf7ec', bottom: 'baggy', botC: '#6b6e78', botS: '#53565f', shoe: '#2b2230', sole: '#fdf7ec' },
    { name: 'Rex', hair: 'curly', hairC: '#2b2630', hairS: '#4a4452', flower: '#d0453d', skin: '#f3d2b8', skinS: '#dcb294', lips: '#a8574f', blush: '#f3d2b8', shades: true, top: 'coat', topC: '#8a6448', topS: '#6b4a34', inner: '#f4efe2', bottom: 'pants', botC: '#9aa0ab', botS: '#7d838e', shoe: '#2b2230', sole: '#4a4452', brow: '#2b2630' },
    { name: 'Jay', hair: 'twists', hairC: '#e8cf8a', hairS: '#c9a95e', roots: '#3a2a20', skin: '#8a5a3c', skinS: '#6e452c', lips: '#5e3624', blush: '#8a5a3c', goggles: true, top: 'fuzzy', topC: '#f0c23a', topS: '#c99a1e', bottom: 'ripped', botC: '#8fa8bf', botS: '#7690a8', shoe: '#2b2230', sole: '#5a5a68', brow: '#3a2a20' },
    { name: 'Nova', hair: 'puff', hairC: '#c0502f', hairS: '#8e3520', skin: '#b5835c', skinS: '#966644', lips: '#7a4232', blush: '#c4876a', top: 'puffer', topC: '#2b2b33', topS: '#16161c', inner: '#5a6070', scarf: '#5a6070', bottom: 'baggy', botC: '#2b2b33', botS: '#1e1e26', shoe: '#2b2230', sole: '#fdf7ec' },
  ]
  const avatarSprites = AVATARS.map(avatar)

