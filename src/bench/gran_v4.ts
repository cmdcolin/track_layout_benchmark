import GranularRectLayoutV4 from '../impl/GranularRectLayoutV4.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutV4()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/granular_v4_${numRects}.png`)
