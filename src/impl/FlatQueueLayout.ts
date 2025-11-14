import FlatQueue from 'flatqueue'
import type { RectTuple, Rectangle } from './BaseLayout.ts'

/**
 * Layout algorithm using priority queues for efficient lane management.
 *
 * IMPORTANT: This algorithm requires rectangles to be added in sorted order
 * by start coordinate. Random/unsorted input will produce incorrect results.
 * The algorithm detects large position decreases (>1000) as chromosome boundaries,
 * but small random jitter will break the sorting assumption.
 */
export default class FlatQueueLayout<T> {
  ylim: number
  ends: FlatQueue<number>
  freeLanes: FlatQueue<number>
  rectangles = new Map<string, Rectangle<T>>()
  padding: number
  lastStart: number
  maxLane: number

  constructor(arg?: { padding?: number; ylim?: number }) {
    const { ylim = 1000, padding = 3 } = arg || {}
    this.ylim = ylim
    this.padding = padding
    this.ends = new FlatQueue()
    this.freeLanes = new FlatQueue()
    this.lastStart = -Infinity
    this.maxLane = 0
  }

  addRect(
    id: string,
    left: number,
    right: number,
    height: number,
    data?: T,
  ): number | null {
    const start = left
    const end = right

    // Free up lanes that have ended or if we're starting a new chromosome
    // NOTE: The chromosome boundary check (>1000 position decrease) is a heuristic
    // that assumes mostly-sorted input. This algorithm is NOT designed for random
    // or unsorted data - it requires rectangles sorted by start coordinate.
    const isNewChromosome = start + 1000 < this.lastStart

    while (
      this.ends.length &&
      (this.ends.peekValue()! < start || isNewChromosome)
    ) {
      const freeLane = this.ends.pop()
      this.freeLanes.push(freeLane!, freeLane!)
    }
    this.lastStart = start

    // Get a free lane or create a new one
    let lane = this.freeLanes.pop()
    if (lane === undefined) {
      if (this.maxLane >= this.ylim) {
        return null
      }
      lane = this.maxLane++
    }

    // Store the rectangle
    this.rectangles.set(id, {
      l: left,
      r: right,
      top: lane * height,
      h: height,
      id,
      data,
    })

    // Track when this lane will be free
    this.ends.push(lane, end)

    return lane
  }

  getRectangles(): Map<string, RectTuple> {
    return new Map(
      Array.from(this.rectangles.entries()).map(([id, rect]) => {
        const { l, r, h, top } = rect
        const t = top || 0
        const b = t + h
        return [id, [l, t, r, b]] // left, top, right, bottom
      }),
    )
  }
}
