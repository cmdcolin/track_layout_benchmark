import SimpleArrLayout from '../impl/SimpleArr.ts'
import { addRects, draw } from '../util.ts'

const l = new SimpleArrLayout()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/simple_arr_${numRects}.png`)
