import IntervalTreeLayout from '../impl/IntervalTree2.ts'
import { addRects, draw } from '../util.ts'

const l = new IntervalTreeLayout()
addRects(l, +process.argv[2])
draw(l, 'interval_tree.png')
