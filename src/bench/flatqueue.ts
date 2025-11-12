import FlatQueueLayout from '../impl/FlatQueueLayout.ts'
import { addRects, draw } from '../util.ts'

const l = new FlatQueueLayout()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/flatqueue_${numRects}.png`)
