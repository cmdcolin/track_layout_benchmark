import BitsetRectLayout from '../impl/BitsetRectLayout.ts'
import { drawWithLayout } from '../util.ts'

const bitsetLayout = new BitsetRectLayout()
drawWithLayout(bitsetLayout, 'bitset.png', +process.argv[2])
