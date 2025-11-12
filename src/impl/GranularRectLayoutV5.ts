import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

const maxFeaturePitchWidth = 20000

// V5: Adds interval merging to reduce collision check overhead
// When intervals are adjacent or overlapping, merge them into one
class V5Row {
  allFilled = false
  intervals: number[]
  mergeEpsilon: number

  constructor(mergeEpsilon: number) {
    this.intervals = []
    this.mergeEpsilon = mergeEpsilon
  }

  intersects(left: number, right: number): boolean {
    const intervals = this.intervals
    const len = intervals.length

    if (len === 0) return false

    // Early reject: completely before or after all intervals
    if (right <= intervals[0] || left >= intervals[len - 1]) {
      return false
    }

    // Linear for small
    if (len < 40) {
      for (let i = 0; i < len; i += 2) {
        if (intervals[i + 1] > left && intervals[i] < right) {
          return true
        }
      }
      return false
    }

    // Binary search + check for large
    let low = 0
    let high = len >>> 1

    while (low < high) {
      const mid = (low + high) >>> 1
      const midIdx = mid << 1
      if (intervals[midIdx + 1] <= left) {
        low = mid + 1
      } else {
        high = mid
      }
    }

    for (let i = low << 1; i < len; i += 2) {
      if (intervals[i] >= right) return false
      if (intervals[i + 1] > left) return true
    }
    return false
  }

  insert(left: number, right: number) {
    const intervals = this.intervals
    const len = intervals.length

    // Find insertion point (always linear search)
    let idx = len
    for (let i = 0; i < len; i += 2) {
      if (left < intervals[i]) {
        idx = i
        break
      }
    }

    // Check if we can merge with previous interval
    let mergeStart = left
    let mergeEnd = right
    let removeStart = idx
    let removeCount = 0
    const epsilon = this.mergeEpsilon

    if (idx > 0) {
      const prevEnd = intervals[idx - 1]
      // Merge if adjacent or overlapping (allowing gap up to epsilon)
      if (prevEnd >= left - epsilon) {
        mergeStart = intervals[idx - 2]
        removeStart = idx - 2
        removeCount += 2
      }
    }

    // Check if we can merge with next interval(s)
    for (let i = idx; i < len; i += 2) {
      const nextStart = intervals[i]
      const nextEnd = intervals[i + 1]
      // Merge if adjacent or overlapping (allowing gap up to epsilon)
      if (nextStart <= mergeEnd + epsilon) {
        mergeEnd = Math.max(mergeEnd, nextEnd)
        if (removeCount === 0) {
          removeStart = i
        }
        removeCount += 2
      } else {
        break
      }
    }

    // Perform the merge
    if (removeCount > 0) {
      // Remove merged intervals and insert the combined one
      intervals.splice(removeStart, removeCount, mergeStart, mergeEnd)
    } else {
      // No merge possible, just insert
      intervals.splice(idx, 0, left, right)
    }
  }
}

export default class GranularRectLayoutV5<T> implements BaseLayout<T> {
  private pitchX: number
  private hardRowLimit: number
  private bitmap: V5Row[]
  private rectangles: Map<string, Rectangle<T>>
  public maxHeightReached: boolean
  private displayMode: string
  private pTotalHeight: number
  private mergeEpsilon: number

  constructor({
    pitchX = 1,
    hardRowLimit = 10000,
    displayMode = 'normal',
    mergeEpsilon = 10,
  }: {
    pitchX?: number
    displayMode?: string
    hardRowLimit?: number
    mergeEpsilon?: number
  } = {}) {
    this.pitchX = pitchX
    this.hardRowLimit = hardRowLimit
    this.maxHeightReached = false
    this.displayMode = displayMode
    this.bitmap = []
    this.rectangles = new Map()
    this.pTotalHeight = 0
    this.mergeEpsilon = mergeEpsilon
  }

  addRect(
    id: string,
    left: number,
    right: number,
    height: number,
    data?: T,
  ): number | null {
    const storedRec = this.rectangles.get(id)
    if (storedRec) {
      if (storedRec.top === null) {
        return null
      }
      this.addRectToBitmap(storedRec)
      return storedRec.top
    }

    const pLeft = (left / this.pitchX) | 0
    const pRight = (right / this.pitchX) | 0

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
      const bitmap = this.bitmap
      const hardRowLimit = this.hardRowLimit

      // Find first available row
      outer: for (; top < hardRowLimit; top++) {
        const row = bitmap[top]

        if (!row) break

        if (row.allFilled) continue

        // Check collision
        if (row.intersects(pLeft, pRight)) {
          continue
        }

        break
      }

      if (top >= hardRowLimit) {
        rectangle.top = null
        this.rectangles.set(id, rectangle)
        this.maxHeightReached = true
        return null
      }
    }

    rectangle.top = top
    this.addRectToBitmap(rectangle)
    this.rectangles.set(id, rectangle)
    if (top > this.pTotalHeight) {
      this.pTotalHeight = top
    }
    return top
  }

  collides(rect: Rectangle<T>, top: number) {
    const row = this.bitmap[top]
    return row !== undefined && (row.allFilled || row.intersects(rect.l, rect.r))
  }

  private autovivifyRow(bitmap: V5Row[], y: number) {
    let row = bitmap[y]
    if (!row) {
      if (y > this.hardRowLimit) {
        throw new Error(
          `layout hard limit (${this.hardRowLimit}px) exceeded, aborting layout`,
        )
      }
      row = new V5Row(this.mergeEpsilon)
      bitmap[y] = row
    }
    return row
  }

  addRectToBitmap(rect: Rectangle<T>) {
    if (rect.top === null) return

    const yEnd = rect.top + rect.h
    if (rect.r - rect.l > maxFeaturePitchWidth) {
      for (let y = rect.top; y < yEnd; y++) {
        this.autovivifyRow(this.bitmap, y).allFilled = true
      }
    } else {
      for (let y = rect.top; y < yEnd; y++) {
        this.autovivifyRow(this.bitmap, y).insert(rect.l, rect.r)
      }
    }
  }

  discardRange(left: number, right: number) {
    const pLeft = (left / this.pitchX) | 0
    const pRight = (right / this.pitchX) | 0

    for (const row of this.bitmap) {
      if (!row || row.allFilled) continue

      const intervals = row.intervals
      const oldLen = intervals.length
      let newLen = 0

      for (let i = 0; i < oldLen; i += 2) {
        const start = intervals[i]
        const end = intervals[i + 1]

        if (start >= pLeft && end <= pRight) {
          continue
        } else if (end <= pLeft || start >= pRight) {
          intervals[newLen++] = start
          intervals[newLen++] = end
        } else if (start < pLeft && end > pLeft) {
          if (end <= pRight) {
            intervals[newLen++] = start
            intervals[newLen++] = pLeft
          } else {
            intervals[newLen++] = start
            intervals[newLen++] = pLeft
            intervals[newLen++] = pRight
            intervals[newLen++] = end
          }
        } else if (start < pRight && end > pRight) {
          intervals[newLen++] = pRight
          intervals[newLen++] = end
        }
      }

      intervals.length = newLen
    }
  }

  hasSeen(id: string) {
    return this.rectangles.has(id)
  }

  getByCoord(x: number, y: number) {
    const row = this.bitmap[y | 0]
    if (!row) return undefined
    if (row.allFilled) return true

    const pX = (x / this.pitchX) | 0
    const intervals = row.intervals
    const len = intervals.length
    for (let i = 0; i < len; i += 2) {
      if (pX >= intervals[i] && pX < intervals[i + 1]) {
        return true
      }
    }
    return undefined
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
