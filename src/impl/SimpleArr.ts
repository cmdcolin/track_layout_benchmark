import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

/**
 * Rectangle-layout manager that lays out rectangles using bitmaps at
 * resolution that, for efficiency, may be somewhat lower than that of the
 * coordinate system for the rectangles being laid out.  `pitchX` is the ratios
 * of input scale resolution to internal bitmap resolution.
 */

// minimum excess size of the array at which we garbage collect
const maxFeaturePitchWidth = 20000

export function doesIntersect2(
  left1: number,
  right1: number,
  left2: number,
  right2: number,
) {
  return right1 > left2 && left1 < right2
}

type Interval = [number, number]
interface RowState {
  bits: Interval[]
}
// a single row in the layout
class LayoutRow<T> {
  private padding = 1

  private row?: RowState

  setAllFilled(data?: string) {}

  getItemAt(x: number) {
    if (!this.row) {
      return undefined
    }
    for (let i = 0; i < this.row.bits.length; i++) {
      const r = this.row.bits[i]
      if (doesIntersect2(r[0], r[1], x, x)) {
        return r
      }
    }
    return undefined
  }

  isRangeClear(left: number, right: number) {
    if (!this.row) {
      return true
    }

    for (let i = 0; i < this.row.bits.length; i++) {
      const r = this.row.bits[i]
      if (doesIntersect2(r[0], r[1], left, right)) {
        return false
      }
    }
    return true
  }

  initialize(left: number, right: number) {
    return {
      min: left,
      max: right,
      bits: [],
    }
  }

  addRect(rect: Rectangle<T>, data: string): void {
    const left = rect.l
    const right = rect.r + this.padding // only padding on the right
    if (!this.row) {
      this.row = this.initialize(left, right)
    }
    this.row.bits.push([rect.l, rect.r])
  }
}

export default class GranularRectLayout<T> implements BaseLayout<T> {
  private pitchX: number

  private hardRowLimit: number

  private bitmap: LayoutRow<T>[]

  private rectangles: Map<string, Rectangle<T>>

  public maxHeightReached: boolean

  private displayMode: string

  private pTotalHeight: number

  constructor({
    pitchX = 1,
    hardRowLimit = 1000,
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

  /**
   * @returns top position for the rect, or Null if laying
   *  out the rect would exceed maxHeight
   */
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

      // add it to the bitmap again, since that bitmap range may have been
      // discarded
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
      for (; top < this.hardRowLimit && this.collides(rectangle, top); top++) {}

      if (top >= this.hardRowLimit) {
        rectangle.top = null
        this.rectangles.set(id, rectangle)
        this.maxHeightReached = true
        return null
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

  private autovivifyRow(bitmap: LayoutRow<T>[], y: number) {
    let row = bitmap[y]
    if (!row) {
      if (y > this.hardRowLimit) {
        throw new Error(
          `layout hard limit (${this.hardRowLimit}px) exceeded, aborting layout`,
        )
      }
      row = new LayoutRow()
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
      // the rect is very big in relation to the view size, just pretend, for
      // the purposes of layout, that it extends infinitely.  this will cause
      // weird layout if a user scrolls manually for a very, very long time
      // along the genome at the same zoom level.  but most users will not do
      // that.  hopefully.
      for (let y = rect.top; y < yEnd; y += 1) {
        this.autovivifyRow(this.bitmap, y).setAllFilled(data)
      }
    } else {
      for (let y = rect.top; y < yEnd; y += 1) {
        this.autovivifyRow(this.bitmap, y).addRect(rect, data)
      }
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
        return [id, [l * this.pitchX, t, r * this.pitchX, b]] // left, top, right, bottom
      }),
    )
  }
}
