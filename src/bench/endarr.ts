import EndArrayLayout from '../impl/EndArray.ts'
import { addRects, draw } from '../util.ts'

const l = new EndArrayLayout()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/endarr_${numRects}.png`)
