import GranularRectLayout from '../impl/GranularRectLayout.ts'
import { addRectsUnsorted } from '../util_unsorted.ts'

const l = new GranularRectLayout()
addRectsUnsorted(l, +process.argv[2])
