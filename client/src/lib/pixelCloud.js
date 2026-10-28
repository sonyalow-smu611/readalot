// Scaffolded with AI assistance — see AI_USAGE.md
// A puffy cloud in the town map's pixel style (its helpers and its dark outline): a PNG data URL
// and its size. The loading screen and the way into the salon draw it with hard pixel edges.
import { E, R, mk, outline } from '@/lib/avatar/draw.js'

// size makes a bigger cloud with the same size of pixel (68 x 32 at size 1)
export function drawPixelCloud(size = 1) {
  const k = (n) => Math.round(n * size)
  const [c, x] = mk(k(66), k(30))
  E(x, k(18), k(18), k(13), k(9), '#ffffff')
  E(x, k(34), k(12), k(15), k(11), '#ffffff')
  E(x, k(50), k(18), k(12), k(8), '#ffffff')
  R(x, k(8), k(18), k(52), k(8), '#ffffff')
  R(x, k(8), k(24), k(52), Math.max(2, k(2)), '#dbe8f1')
  R(x, k(26), k(6), k(6), Math.max(2, k(2)), '#f4f9fc')
  const out = outline(c, '#9fb8c8')
  return { src: out.toDataURL('image/png'), width: out.width, height: out.height }
}
