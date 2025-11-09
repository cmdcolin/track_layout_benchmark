import GranularRectLayoutPreSort from '../impl/GranularRectLayoutPreSort.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutPreSort()
addRects(l, +process.argv[2])
draw(l, 'img/presort.png')
