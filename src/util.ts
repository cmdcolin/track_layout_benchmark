import { createCanvas } from 'canvas'
import fs from 'fs'

const width = 2000
const height = 1000

export function drawWithLayout(layout: any, filename: string) {
  for (let i = 0; i < 100000; i++) {
    const x1 = i / 100
    const x2 = x1 + 100
    layout.addRect(`${i}`, x1, x2, 10)
  }

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)
  for (const val of layout.getRectangles().values()) {
    var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16)
    ctx.fillStyle = randomColor
    ctx.fillRect(val[0], val[1], val[2] - val[0], val[3] - val[1])
  }
  const out = fs.createWriteStream(filename)
  const stream = canvas.createPNGStream()
  stream.pipe(out)
}
