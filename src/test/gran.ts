import GranularRectLayout from '../impl/GranularRectLayout.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayout()
addRects(l, +process.argv[2])
console.log('wtf')
l.discardRange(0, 2000)
draw(l, 'granular.png')
