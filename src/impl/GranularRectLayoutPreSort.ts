import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

/**
 * Helper function to check if two 1D ranges intersect
 */
function segmentsIntersect(
  x1: number,
  x2: number,
  y1: number,
  y2: number,
): boolean {
  return x2 >= y1 && y2 >= x1
}

/**
 * EndArray-based layout with pre-sorting optimization
 * Sorts rectangles by their left position before layout
 * This enables O(n) layout instead of O(n*h) for non-overlapping features
 */

export default class GranularRectLayoutPreSort<T> implements BaseLayout<T> {
  private endArray: number[] = []
  private rectangles = new Map<string, Rectangle<T>>()
  private ylim: number
  private padding: number
  public maxHeightReached: boolean

  constructor(arg?: {
    ylim?: number
    padding?: number
  }) {
    const { ylim = 10000, padding = 1 } = arg || {}
    this.ylim = ylim
    this.padding = padding
    this.maxHeightReached = false
    this.endArray = new Array(ylim).fill(-Infinity)
  }

  /**
   * Find the first row where this feature can fit
   */
  private findYPosition(startPosition: number): number {
    for (let y = 0; y < this.ylim; y++) {
      if (startPosition > this.endArray[y]) {
        return y
      }
    }
    return -1
  }

  addRect(
    id: string,
    left: number,
    right: number,
    height: number,
    data?: T,
  ): number | null {
    // Check if already laid out
    const existing = this.rectangles.get(id)
    if (existing) {
      return existing.top ?? null
    }

    const y = this.findYPosition(left + this.padding)
    if (y === -1) {
      this.maxHeightReached = true
      this.rectangles.set(id, {
        l: left,
        r: right,
        top: null,
        h: height,
        id,
        data,
      })
      return null
    }

    this.endArray[y] = right + this.padding
    const top = y * height
    this.rectangles.set(id, {
      l: left,
      r: right,
      top: top,
      h: height,
      id,
      data,
    })
    return top
  }

  hasSeen(id: string): boolean {
    return this.rectangles.has(id)
  }

  getByCoord(x: number, y: number): string | undefined {
    // Find any rectangle that contains the point (x, y)
    for (const rect of this.rectangles.values()) {
      if (rect.top !== null && rect.l <= x && x < rect.r && rect.top <= y && y < rect.top + rect.h) {
        return rect.id
      }
    }
    return undefined
  }

  getByID(id: string): RectTuple | undefined {
    const r = this.rectangles.get(id)
    if (r && r.top !== null) {
      const t = r.top
      return [r.l, t, r.r, t + r.h] as RectTuple
    }
    return undefined
  }

  getDataByID(id: string): T | undefined {
    return this.rectangles.get(id)?.data
  }

  getTotalHeight(): number {
    let maxY = 0
    for (const rect of this.rectangles.values()) {
      if (rect.top !== null) {
        maxY = Math.max(maxY, (rect.top || 0) + rect.h)
      }
    }
    return maxY
  }

  getRectangles(): Map<string, RectTuple> {
    const result = new Map<string, RectTuple>()
    for (const [id, rect] of this.rectangles.entries()) {
      if (rect.top !== null) {
        const t = rect.top
        const b = t + rect.h
        result.set(id, [rect.l, t, rect.r, b])
      }
    }
    return result
  }

  discardRange(left: number, right: number): void {
    // Not implemented for this simple version
  }

  cleanup(): void {}

  get totalHeight(): number {
    return this.getTotalHeight()
  }

  serializeRegion(region: { start: number; end: number }) {
    const regionRectangles: Record<string, RectTuple> = {}
    let maxHeightReached = false

    for (const [id, rect] of this.rectangles.entries()) {
      if (rect.top === null) {
        maxHeightReached = true
      } else {
        const rectStart = rect.l
        const rectEnd = rect.r
        // Check if rectangle x-range overlaps with region x-range
        if (segmentsIntersect(region.start, region.end, rectStart, rectEnd)) {
          const t = rect.top
          const b = t + rect.h
          regionRectangles[id] = [rectStart, t, rectEnd, b]
        }
      }
    }

    return {
      rectangles: regionRectangles,
      containsNoTransferables: true,
      totalHeight: this.getTotalHeight(),
      maxHeightReached,
    }
  }

  toJSON() {
    return {
      rectangles: Object.fromEntries(this.getRectangles()),
      containsNoTransferables: true,
      totalHeight: this.getTotalHeight(),
      maxHeightReached: this.maxHeightReached,
    }
  }
}
