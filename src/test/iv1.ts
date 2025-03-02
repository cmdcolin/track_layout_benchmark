import IntervalTreeLayout from '../impl/IntervalTree1.ts'
import { addRects, draw } from '../util.ts'

const l = new IntervalTreeLayout()
addRects(l, +process.argv[2])
draw(l, 'iv1.png')
