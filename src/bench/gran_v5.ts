import GranularRectLayoutV5 from '../impl/GranularRectLayoutV5.ts'
import { addRects, draw } from '../util.ts'

const l = new GranularRectLayoutV5()
const numRects = +process.argv[2]
addRects(l, numRects)
draw(l, `img/granular_v5_${numRects}.png`)
