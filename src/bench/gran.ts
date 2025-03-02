import GranularRectLayout from '../impl/GranularRectLayout.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayout()
addRects(l, +process.argv[2])
draw(l, 'img/granular.png')
