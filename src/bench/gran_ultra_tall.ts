import GranularRectLayoutUltra from '../impl/GranularRectLayoutUltra.ts'
import { addRects, draw } from '../util_tall.ts'

const l = new GranularRectLayoutUltra()
const numRects = 50000
addRects(l, numRects)
draw(l, `img/gran_ultra_tall_${numRects}.png`)
