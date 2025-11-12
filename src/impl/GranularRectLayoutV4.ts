import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

const maxFeaturePitchWidth = 20000

// V4: Fixed version - combines V3's correctness with better optimizations
class V4Row {
  allFilled = false
  intervals: Int32Array
  len = 0

  constructor() {
    this.intervals = new Int32Array(64)
  }

  grow() {
    const newArray = new Int32Array(this.intervals.length * 2)
    newArray.set(this.intervals.subarray(0, this.len))
    this.intervals = newArray
  }

  intersects(left: number, right: number): boolean {
    const intervals = this.intervals
    const len = this.len

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

    // Binary search + check
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
    const len = this.len

    // Find insertion point
    let idx: number
    if (len < 40) {
      idx = len
      for (let i = 0; i < len; i += 2) {
        if (left < intervals[i]) {
          idx = i
          break
        }
      }
    } else {
      let low = 0
      let high = len >>> 1
      while (low < high) {
        const mid = (low + high) >>> 1
        const midIdx = mid << 1
        if (intervals[midIdx] < left) {
          low = mid + 1
        } else {
          high = mid
        }
      }
      idx = low << 1
    }

    // Grow if needed
    if (len + 2 > intervals.length) {
      this.grow()
    }

    // Shift and insert using subarray copy (faster than loop)
    const arr = this.intervals
    if (idx < len) {
      // Copy [idx, len) to [idx+2, len+2)
      arr.copyWithin(idx + 2, idx, len)
    }
    arr[idx] = left
    arr[idx + 1] = right
    this.len += 2
  }
}

export default class GranularRectLayoutV4<T> implements BaseLayout<T> {
  private pitchX: number
  private hardRowLimit: number
  private bitmap: V4Row[]
  private rectangles: Map<string, Rectangle<T>>
  public maxHeightReached: boolean
  private displayMode: string
  private pTotalHeight: number

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

      // Ultra-inline hot path
      outer: for (; top < hardRowLimit; top++) {
        const row = bitmap[top]

        if (!row) break

        if (row.allFilled) continue

        // Inline collision check with early reject
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

  private autovivifyRow(bitmap: V4Row[], y: number) {
    let row = bitmap[y]
    if (!row) {
      if (y > this.hardRowLimit) {
        throw new Error(
          `layout hard limit (${this.hardRowLimit}px) exceeded, aborting layout`,
        )
      }
      row = new V4Row()
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
      const oldLen = row.len
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

      row.len = newLen
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
    const len = row.len
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
