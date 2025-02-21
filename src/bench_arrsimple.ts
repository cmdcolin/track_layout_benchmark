import SimpleArrLayout from './SimpleArr.ts'
import { drawWithLayout } from './util.ts'

const granularLayout = new SimpleArrLayout({ hardRowLimit: 10000 })
drawWithLayout(granularLayout, 'simple_arr.png', +process.argv[2])
