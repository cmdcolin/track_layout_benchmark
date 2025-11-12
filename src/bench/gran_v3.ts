import GranularRectLayoutV3 from '../impl/GranularRectLayoutV3.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutV3()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/granular_v3_${numRects}.png`)
