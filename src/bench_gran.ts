import GranularRectLayout from './GranularRectLayout.ts'
import { drawWithLayout } from './util.ts'
const granularLayout = new GranularRectLayout({ hardRowLimit: 10000 })
drawWithLayout(granularLayout, 'granular.png')
