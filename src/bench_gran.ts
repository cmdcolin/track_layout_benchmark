import GranularRectLayout from './GranularRectLayout.ts'
import { drawWithLayout } from './util.ts'
const granularLayout = new GranularRectLayout({ hardRowLimit: 10000 })
console.log('laying out', process.argv[2])
drawWithLayout(granularLayout, 'granular.png', +process.argv[2])
