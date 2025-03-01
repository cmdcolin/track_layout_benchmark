import SimpleArrLayout from '../impl/SimpleArr.ts'
import { addRects, draw } from '../util.ts'

const l = new SimpleArrLayout()
addRects(l, +process.argv[2])
draw(l, 'simple_arr.png')
