import EndArrayLayout from '../impl/EndArray.ts'
import { addRects, draw } from '../util.ts'

const l = new EndArrayLayout()
addRects(l, +process.argv[2])
draw(l, 'img/endarr.png')
