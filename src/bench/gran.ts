import GranularRectLayout from '../impl/GranularRectLayout.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayout()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/granular_${numRects}.png`)
