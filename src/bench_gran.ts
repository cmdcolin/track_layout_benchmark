import GranularRectLayout from './GranularRectLayout'
import { drawWithLayout } from './util'
const granularLayout = new GranularRectLayout({ hardRowLimit: 10000 })
drawWithLayout(granularLayout, 'granular.png')
