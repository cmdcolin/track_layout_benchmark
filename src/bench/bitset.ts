import BitsetRectLayout from '../impl/BitsetRectLayout.ts'
import { addRects, draw } from '../util.ts'

const l = new BitsetRectLayout()
addRects(l, +process.argv[2])
draw(l, 'img/bitset.png')
