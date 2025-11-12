import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

const maxFeaturePitchWidth = 20000

// Ultra-minimal row class
class UltraRow {
  allFilled = false
  // Flat array of intervals: [start1, end1, start2, end2, ...]
  i: number[] = []
}

export default class GranularRectLayoutUltra<T> implements BaseLayout<T> {
  private pitchX: number
  private hardRowLimit: number
  private bitmap: UltraRow[]
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
    // Fast path: check cache first
    const storedRec = this.rectangles.get(id)
    if (storedRec) {
      if (storedRec.top === null) {
        return null
      }
      this.addRectToBitmap(storedRec)
      return storedRec.top
    }

    // Use bitwise OR for fast floor
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
      const pL = pLeft
      const pR = pRight

      // Inline collision checking - ultra fast path
      outer: for (; top < hardRowLimit; top++) {
        const row = bitmap[top]

        // Fast path: no row yet
        if (!row) {
          break
        }

        // Fast path: all filled
        if (row.allFilled) {
          continue
        }

        // Inline range check with hybrid approach
        const intervals = row.i
        const len = intervals.length

        // Linear scan for small arrays (< 40 elements = 20 intervals)
        if (len < 40) {
          for (let i = 0; i < len; i += 2) {
            // Intersection: end > left && start < right
            if (intervals[i + 1] > pL && intervals[i] < pR) {
              continue outer
            }
          }
          break
        }

        // Binary search for larger arrays
        let low = 0
        let high = len >> 1 // Divide by 2 using bit shift

        while (low < high) {
          const mid = (low + high) >>> 1
          const midIdx = mid << 1 // Multiply by 2
          if (intervals[midIdx + 1] <= pL) {
            low = mid + 1
          } else {
            high = mid
          }
        }

        // Check from binary search point
        for (let i = low << 1; i < len; i += 2) {
          if (intervals[i] >= pR) {
            break outer // No more possible overlaps
          }
          if (intervals[i + 1] > pL) {
            continue outer // Collision found
          }
        }

        // No collision
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
    if (!row || row.allFilled) {
      return row !== undefined
    }

    const intervals = row.i
    const len = intervals.length
    const left = rect.l
    const right = rect.r

    for (let i = 0; i < len; i += 2) {
      if (intervals[i + 1] > left && intervals[i] < right) {
        return true
      }
    }
    return false
  }

  private autovivifyRow(bitmap: UltraRow[], y: number) {
    let row = bitmap[y]
    if (!row) {
      if (y > this.hardRowLimit) {
        throw new Error(
          `layout hard limit (${this.hardRowLimit}px) exceeded, aborting layout`,
        )
      }
      row = new UltraRow()
      bitmap[y] = row
    }
    return row
  }

  addRectToBitmap(rect: Rectangle<T>) {
    if (rect.top === null) {
      return
    }

    const yEnd = rect.top + rect.h
    if (rect.r - rect.l > maxFeaturePitchWidth) {
      for (let y = rect.top; y < yEnd; y += 1) {
        this.autovivifyRow(this.bitmap, y).allFilled = true
      }
    } else {
      const left = rect.l
      const right = rect.r
      for (let y = rect.top; y < yEnd; y += 1) {
        const row = this.autovivifyRow(this.bitmap, y)
        const intervals = row.i
        const len = intervals.length

        // Inline sorted insertion with hybrid approach
        if (len < 40) {
          // Linear insertion for small arrays
          let idx = len
          for (let i = 0; i < len; i += 2) {
            if (left < intervals[i]) {
              idx = i
              break
            }
          }
          intervals.splice(idx, 0, left, right)
        } else {
          // Binary search insertion for larger arrays
          let low = 0
          let high = len >> 1

          while (low < high) {
            const mid = (low + high) >>> 1
            const midIdx = mid << 1
            if (intervals[midIdx] < left) {
              low = mid + 1
            } else {
              high = mid
            }
          }

          intervals.splice(low << 1, 0, left, right)
        }
      }
    }
  }

  discardRange(left: number, right: number) {
    const pLeft = (left / this.pitchX) | 0
    const pRight = (right / this.pitchX) | 0
    const len = this.bitmap.length

    for (let y = 0; y < len; y += 1) {
      const row = this.bitmap[y]
      if (!row || row.allFilled) {
        continue
      }

      const intervals = row.i
      const oldLen = intervals.length
      const newIntervals: number[] = []

      for (let i = 0; i < oldLen; i += 2) {
        const start = intervals[i]
        const end = intervals[i + 1]

        if (start >= pLeft && end <= pRight) {
          continue
        } else if (end <= pLeft || start >= pRight) {
          newIntervals.push(start, end)
        } else if (start < pLeft && end > pLeft) {
          if (end <= pRight) {
            newIntervals.push(start, pLeft)
          } else {
            newIntervals.push(start, pLeft, pRight, end)
          }
        } else if (start < pRight && end > pRight) {
          newIntervals.push(pRight, end)
        }
      }

      row.i = newIntervals
    }
  }

  hasSeen(id: string) {
    return this.rectangles.has(id)
  }

  getByCoord(x: number, y: number) {
    const row = this.bitmap[y | 0]
    if (!row) {
      return undefined
    }
    if (row.allFilled) {
      return true
    }

    const pX = (x / this.pitchX) | 0
    const intervals = row.i
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
