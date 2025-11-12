import GranularRectLayoutIntervals from '../impl/GranularRectLayoutIntervals.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutIntervals()
addRects(l, +process.argv[2])
draw(l, 'img/granular_intervals.png')
