import SimpleArrLayout from '../impl/SimpleArr.ts'
import { addRects, draw } from '../util_tall.ts'

const l = new SimpleArrLayout()
const numRects = 50000
addRects(l, numRects)
draw(l, `img/simple_arr_tall_${numRects}.png`)
