// Scaffolded with AI assistance — see AI_USAGE.md
// Two blocky alphabets for the town's signs, drawn as whole blocks. Each letter is its rows, one
// block to a digit. LARGE is five blocks wide; SMALL is three, with a wider M, N and W.
export const LARGE = {
  A: '01110 10001 10001 11111 10001 10001 10001',
  B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01111 10000 10000 10000 10000 10000 01111',
  D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111',
  F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01111 10000 10000 10011 10001 10001 01111',
  H: '10001 10001 10001 11111 10001 10001 10001',
  I: '11111 00100 00100 00100 00100 00100 11111',
  J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001',
  L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001',
  N: '10001 11001 10101 10011 10001 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101',
  R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110',
  T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 11011 10001',
  X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100',
  Z: '11111 00001 00010 00100 01000 10000 11111',
}

export const SMALL = {
  A: '010 101 111 101 101',
  B: '110 101 110 101 110',
  C: '011 100 100 100 011',
  D: '110 101 101 101 110',
  E: '111 100 110 100 111',
  F: '111 100 110 100 100',
  G: '011 100 101 101 011',
  H: '101 101 111 101 101',
  I: '111 010 010 010 111',
  J: '001 001 001 101 010',
  K: '101 101 110 101 101',
  L: '100 100 100 100 111',
  M: '10001 11011 10101 10001 10001',
  N: '1001 1101 1011 1001 1001',
  O: '010 101 101 101 010',
  P: '110 101 110 100 100',
  Q: '010 101 101 110 011',
  R: '110 101 110 101 101',
  S: '011 100 010 001 110',
  T: '111 010 010 010 010',
  U: '101 101 101 101 111',
  V: '101 101 101 101 010',
  W: '10001 10001 10101 11011 10001',
  X: '101 101 010 101 101',
  Y: '101 101 010 010 010',
  Z: '111 001 010 100 111',
}

const SPACE = 3

function letters(font, text) {
  return [...text.toUpperCase()].map((letter) => font[letter]?.split(' ') ?? null)
}

// How wide `text` runs in blocks. `bold` thickens each letter by one block and `gap` is the space
// between letters.
export function measure(font, text, bold, gap) {
  const widths = letters(font, text).map((rows) => (rows ? rows[0].length + (bold ? 1 : 0) : SPACE))
  return widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1)
}

// Writes `text` centred on `middle`, with its top at `top`, in blocks of `colour`.
export function write(x, font, text, middle, top, colour, bold = false, gap = 1) {
  x.fillStyle = colour
  let left = Math.round(middle - measure(font, text, bold, gap) / 2)
  for (const rows of letters(font, text)) {
    if (!rows) {
      left += SPACE + gap
      continue
    }
    rows.forEach((row, down) => {
      for (let across = 0; across < row.length; across++) {
        if (row[across] === '1') x.fillRect(left + across, top + down, bold ? 2 : 1, 1)
      }
    })
    left += rows[0].length + (bold ? 1 : 0) + gap
  }
}
