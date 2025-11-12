import GranularRectLayoutRowHints from '../impl/GranularRectLayoutRowHints.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutRowHints()
addRects(l, +process.argv[2])
draw(l, 'img/granular_rowhints.png')
