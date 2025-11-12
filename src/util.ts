import { createCanvas } from 'canvas'
import { createWriteStream } from 'fs'

const width = 20000
const height = 5000
const fw = 100
const w2 = width - fw

export function addRects(layout: any, n: number) {
  for (let i = 0; i < n; i++) {
    const x1 = Math.max(0, (i / n) * w2 + Math.floor(Math.random() * 500 - 250))
    const x2 = x1 + fw
    layout.addRect(`${i}`, x1, x2, 10)
  }
}

export function draw(layout: any, filename: string) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)
  for (const val of layout.getRectangles().values()) {
    ctx.fillStyle = `hsl(${Math.random() * 300},80%,50%)`
    if (val[1]) {
      ctx.fillRect(val[0], val[1], val[2] - val[0], val[3] - val[1])
    }
  }
  const out = createWriteStream(filename)
  const stream = canvas.createPNGStream()
  stream.pipe(out)
}
