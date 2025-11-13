import FlatQueueLayout from '../impl/FlatQueueLayout.ts'
import { addRects, draw } from '../util_tall.ts'

const l = new FlatQueueLayout()
const numRects = 50000
addRects(l, numRects)
draw(l, `img/flatqueue_tall_${numRects}.png`)
