import GranularRectLayoutIntervals from '../impl/GranularRectLayoutIntervals.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutIntervals()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/granular_intervals_${numRects}.png`)
