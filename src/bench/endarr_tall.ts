import EndArrayLayout from '../impl/EndArray.ts'
import { addRects, draw } from '../util_tall.ts'

const l = new EndArrayLayout()
const numRects = 50000
addRects(l, numRects)
draw(l, `img/endarr_tall_${numRects}.png`)
