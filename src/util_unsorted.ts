import seedrandom from 'seed-random'

const width = 20000
const height = 1000
const fw = 100
const w2 = width - fw

/**
 * Add rectangles in a random order (unsorted)
 */
export function addRectsUnsorted(layout: any, n: number) {
  const rng = seedrandom('unsorted-test') // deterministic randomness
  const indices = Array.from({ length: n }, (_, i) => i)

  // Shuffle the indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }

  for (const i of indices) {
    const x1 = (i / n) * w2
    const x2 = x1 + fw
    layout.addRect(`${i}`, x1, x2, 10)
  }
}

/**
 * Add rectangles in sorted order (pre-sorted)
 */
export function addRectsSorted(layout: any, n: number) {
  for (let i = 0; i < n; i++) {
    const x1 = (i / n) * w2
    const x2 = x1 + fw
    layout.addRect(`${i}`, x1, x2, 10)
  }
}

export function draw(layout: any, filename: string) {
  const canvas = require('canvas').createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)
  for (const val of layout.getRectangles().values()) {
    ctx.fillStyle = `hsl(${Math.random() * 300},80%,50%)`
    if (val[1]) {
      ctx.fillRect(val[0], val[1], val[2] - val[0], val[3] - val[1])
    }
  }
  const out = require('fs').createWriteStream(filename)
  const stream = canvas.createPNGStream()
  stream.pipe(out)
}
