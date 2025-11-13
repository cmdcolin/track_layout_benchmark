import IntervalTreeLayout from '../impl/IntervalTree2.ts'
import { addRects, draw } from '../util_tall.ts'

const l = new IntervalTreeLayout()
const numRects = 50000
addRects(l, numRects)
draw(l, `img/iv2_tall_${numRects}.png`)
