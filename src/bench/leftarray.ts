import LeftArrayLayout from '../impl/LeftArray.ts'
import { addRects, draw } from '../util.ts'

const l = new LeftArrayLayout()
addRects(l, +process.argv[2])
draw(l, 'img/leftarray.png')
