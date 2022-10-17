import SimpleArrLayout from './SimpleArr'
import { drawWithLayout } from './util'
const granularLayout = new SimpleArrLayout({ hardRowLimit: 10000 })
drawWithLayout(granularLayout, 'simple_arr.png')
