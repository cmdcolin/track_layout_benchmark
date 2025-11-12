import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

const maxFeaturePitchWidth = 20000

interface Interval {
  start: number
  end: number
  data: string
}

// a single row in the layout using sorted intervals
class IntervalLayoutRow<T> {
  private padding = 1
  private allFilled?: boolean
  private intervals: Interval[] = []

  setAllFilled(data?: string) {
    this.allFilled = !!data
  }

  getItemAt(x: number) {
    if (this.allFilled) {
      return this.allFilled
    }

    // Binary search for interval containing x
    for (const interval of this.intervals) {
      if (x >= interval.start && x < interval.end) {
        return interval.data
      }
      if (interval.start > x) {
        break
      }
    }
    return undefined
  }

  isRangeClear(left: number, right: number): boolean {
    if (this.allFilled) {
      return false
    }

    // Binary search for first interval that might overlap
    let low = 0
    let high = this.intervals.length

    while (low < high) {
      const mid = (low + high) >>> 1
      if (this.intervals[mid].end <= left) {
        low = mid + 1
      } else {
        high = mid
      }
    }

    // Check if any intervals overlap with [left, right)
    for (let i = low; i < this.intervals.length; i++) {
      const interval = this.intervals[i]
      if (interval.start >= right) {
        break // No more overlaps possible
      }
      if (interval.start < right && interval.end > left) {
        return false // Overlap found
      }
    }

    return true
  }

  addRect(rect: Rectangle<T>, data: string): void {
    const left = rect.l
    const right = rect.r + this.padding

    // Binary search for insertion point
    let idx = this.intervals.length
    for (let i = 0; i < this.intervals.length; i++) {
      if (left < this.intervals[i].start) {
        idx = i
        break
      }
    }

    // Insert the new interval
    this.intervals.splice(idx, 0, { start: left, end: right, data })

    // Merge overlapping/adjacent intervals with same data
    this.mergeAt(idx)
  }

  private mergeAt(idx: number): void {
    // Merge with previous interval if overlapping/adjacent and same data
    while (idx > 0) {
      const prev = this.intervals[idx - 1]
      const curr = this.intervals[idx]
      if (prev.end >= curr.start && prev.data === curr.data) {
        prev.end = Math.max(prev.end, curr.end)
        this.intervals.splice(idx, 1)
        idx--
      } else {
        break
      }
    }

    // Merge with next interval if overlapping/adjacent and same data
    while (idx < this.intervals.length - 1) {
      const curr = this.intervals[idx]
      const next = this.intervals[idx + 1]
      if (curr.end >= next.start && curr.data === next.data) {
        curr.end = Math.max(curr.end, next.end)
        this.intervals.splice(idx + 1, 1)
      } else {
        break
      }
    }
  }

  discardRange(left: number, right: number): void {
    if (this.allFilled) {
      return
    }

    // Remove or trim intervals that overlap with [left, right)
    for (let i = this.intervals.length - 1; i >= 0; i--) {
      const interval = this.intervals[i]

      // If interval is completely within discard range, remove it
      if (interval.start >= left && interval.end <= right) {
        this.intervals.splice(i, 1)
      }
      // If interval overlaps left edge
      else if (interval.start < left && interval.end > left) {
        if (interval.end <= right) {
          // Trim from the right
          interval.end = left
        } else {
          // Interval spans the entire discard range, split it
          const newInterval = {
            start: right,
            end: interval.end,
            data: interval.data,
          }
          interval.end = left
          this.intervals.splice(i + 1, 0, newInterval)
        }
      }
      // If interval overlaps right edge
      else if (interval.start < right && interval.end > right) {
        interval.start = right
      }
    }
  }
}

export default class GranularRectLayoutIntervals<T> implements BaseLayout<T> {
  private pitchX: number

  private hardRowLimit: number

  private bitmap: IntervalLayoutRow<T>[]

  private rectangles: Map<string, Rectangle<T>>

  public maxHeightReached: boolean

  private displayMode: string

  private pTotalHeight: number

  // Row hint optimization
  private minAvailableRow: number = 0

  constructor({
    pitchX = 1,
    hardRowLimit = 10000,
    displayMode = 'normal',
  }: {
    pitchX?: number
    displayMode?: string
    hardRowLimit?: number
  } = {}) {
    this.pitchX = pitchX
    this.hardRowLimit = hardRowLimit
    this.maxHeightReached = false
    this.displayMode = displayMode
    this.bitmap = []
    this.rectangles = new Map()
    this.pTotalHeight = 0
  }

  addRect(
    id: string,
    left: number,
    right: number,
    height: number,
    data?: T,
  ): number | null {
    // if we have already laid it out, return its layout
    const storedRec = this.rectangles.get(id)
    if (storedRec) {
      if (storedRec.top === null) {
        return null
      }
      this.addRectToBitmap(storedRec)
      return storedRec.top
    }

    const pLeft = Math.floor(left / this.pitchX)
    const pRight = Math.floor(right / this.pitchX)

    const rectangle: Rectangle<T> = {
      id,
      l: pLeft,
      r: pRight,
      top: null,
      h: height,
      data,
    }

    let top = 0
    if (this.displayMode !== 'collapse') {
      // Start searching from the hint
      top = this.minAvailableRow

      for (; top < this.hardRowLimit && this.collides(rectangle, top); top++) {}

      if (top >= this.hardRowLimit) {
        rectangle.top = null
        this.rectangles.set(id, rectangle)
        this.maxHeightReached = true
        return null
      }

      // Update hint: if we placed below the hint, lower it
      if (top < this.minAvailableRow) {
        this.minAvailableRow = top
      }
    }

    rectangle.top = top
    this.addRectToBitmap(rectangle)
    this.rectangles.set(id, rectangle)
    this.pTotalHeight = Math.max(this.pTotalHeight, top)
    return top
  }

  collides(rect: Rectangle<T>, top: number) {
    const { bitmap } = this

    const y = top
    const row = bitmap[y]
    if (row !== undefined && !row.isRangeClear(rect.l, rect.r)) {
      return true
    }

    return false
  }

  private autovivifyRow(bitmap: IntervalLayoutRow<T>[], y: number) {
    let row = bitmap[y]
    if (!row) {
      if (y > this.hardRowLimit) {
        throw new Error(
          `layout hard limit (${this.hardRowLimit}px) exceeded, aborting layout`,
        )
      }
      row = new IntervalLayoutRow()
      bitmap[y] = row
    }
    return row
  }

  addRectToBitmap(rect: Rectangle<T>) {
    if (rect.top === null) {
      return
    }

    const data = rect.id
    const yEnd = rect.top + rect.h
    if (rect.r - rect.l > maxFeaturePitchWidth) {
      for (let y = rect.top; y < yEnd; y += 1) {
        this.autovivifyRow(this.bitmap, y).setAllFilled(data)
      }
    } else {
      for (let y = rect.top; y < yEnd; y += 1) {
        this.autovivifyRow(this.bitmap, y).addRect(rect, data)
      }
    }
  }

  discardRange(left: number, right: number) {
    const pLeft = Math.floor(left / this.pitchX)
    const pRight = Math.floor(right / this.pitchX)
    for (let y = 0; y < this.bitmap.length; y += 1) {
      this.bitmap[y]?.discardRange(pLeft, pRight)
    }
  }

  hasSeen(id: string) {
    return this.rectangles.has(id)
  }

  getByCoord(x: number, y: number) {
    return this.bitmap[Math.floor(y)]?.getItemAt(Math.floor(x / this.pitchX))
  }

  getByID(id: string) {
    const r = this.rectangles.get(id)
    if (r) {
      const t = r.top!
      return [r.l * this.pitchX, t, r.r * this.pitchX, t + r.h] as RectTuple
    }

    return undefined
  }

  getDataByID(id: string) {
    return this.rectangles.get(id)?.data
  }

  getTotalHeight() {
    return this.pTotalHeight
  }

  getRectangles(): Map<string, RectTuple> {
    return new Map(
      Array.from(this.rectangles.entries()).map(([id, rect]) => {
        const { l, r, h, top } = rect
        const t = top || 0
        const b = t + h
        return [id, [l * this.pitchX, t, r * this.pitchX, b]]
      }),
    )
  }
}
