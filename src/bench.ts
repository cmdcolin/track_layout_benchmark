import GranularRectLayout from './GranularRectLayout'
import BitsetRectLayout from './BitsetRectLayout'
import { createCanvas } from 'canvas'
import fs from 'fs'

const width = 2000
const height = 1000

const layout = new GranularRectLayout()
for (let i = 0; i < 100000; i++) {
  const x1 = Math.floor(Math.random() * width)
  const x2 = x1 + 100
  layout.addRect(`${i}`, x1, x2, 10)
}

const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')
ctx.fillStyle = 'black'
ctx.fillRect(0, 0, width, height)
console.log('j1')
for (const val of layout.getRectangles().values()) {
  var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16)
  ctx.fillStyle = randomColor
  ctx.fillRect(val[0], val[1], val[2] - val[0], val[3] - val[1])
}
const out = fs.createWriteStream('test.png')
const stream = canvas.createPNGStream()
stream.pipe(out)
out.on('finish', () => console.log('The PNG file was created.'))
