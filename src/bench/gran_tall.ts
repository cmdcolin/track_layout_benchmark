import GranularRectLayout from '../impl/GranularRectLayout.ts'
import { addRects, draw } from '../util_tall.ts'

const l = new GranularRectLayout()
const numRects = 50000
addRects(l, numRects)
draw(l, `img/granular_tall_${numRects}.png`)
