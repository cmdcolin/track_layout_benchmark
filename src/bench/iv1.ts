import IntervalTreeLayout from '../impl/IntervalTree1.ts'
import { addRects, draw } from '../util.ts'

const l = new IntervalTreeLayout()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/iv1_${numRects}.png`)
