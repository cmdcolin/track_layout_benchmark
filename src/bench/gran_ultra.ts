import GranularRectLayoutUltra from '../impl/GranularRectLayoutUltra.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutUltra()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/granular_ultra_${numRects}.png`)
