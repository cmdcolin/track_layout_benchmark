import IntervalTreeLayout from './IntervalTree.ts'
import { drawWithLayout } from './util.ts'
const granularLayout = new IntervalTreeLayout()
drawWithLayout(granularLayout, 'interval_tree.png', +process.argv[2])
