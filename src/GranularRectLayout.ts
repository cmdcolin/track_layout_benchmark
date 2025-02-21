import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

// minimum excess size of the array at which we garbage collect
const minSizeToBotherWith = 10000
const maxFeaturePitchWidth = 20000

interface RowState {
  min: number
  max: number
  offset: number
  bits: (string | undefined)[]
}
// a single row in the layout
class LayoutRow<T> {
  private padding = 1

  private allFilled?: boolean

  private widthLimit = 1_000_000

  private row?: RowState

  setAllFilled(data?: string) {
    this.allFilled = !!data
  }

  getItemAt(x: number) {
    if (this.allFilled) {
      return this.allFilled
    }
    if (this.row === undefined || x < this.row.min || x >= this.row.max) {
      return undefined
    }
    return this.row.bits[x - this.row.offset]
  }

  isRangeClear(left: number, right: number) {
    if (this.allFilled) {
      return false
    }

    if (
      this.row === undefined ||
      right <= this.row.min ||
      left >= this.row.max
    ) {
      return true
    }
    const { min, max, offset, bits } = this.row

    const maxX = Math.min(max, right) - offset
    let flag = true
    for (let x = Math.max(min, left) - offset; x < maxX && flag; x++) {
      flag = bits[x] === undefined
    }

    return flag
  }

  // NOTE: this.row.min, this.row.max, and this.row.offset are
  // interbase coordinates
  initialize(left: number, right: number): RowState {
    const rectWidth = right - left
    return {
      offset: left - rectWidth,
      min: left,
      max: right,
      bits: new Array(3 * rectWidth),
    }
  }

  addRect(rect: Rectangle<T>, data: string): void {
    const left = rect.l
    const right = rect.r + this.padding // only padding on the right
    if (!this.row) {
      this.row = this.initialize(left, right)
    }

    // or check if we need to expand to the left and/or to the right
    let oLeft = left - this.row.offset
    let oRight = right - this.row.offset
    const currLength = this.row.bits.length

    // expand rightward if necessary
    if (oRight >= this.row.bits.length) {
      const additionalLength = oRight + 1
      if (this.row.bits.length + additionalLength > this.widthLimit) {
        console.warn(
          'Layout width limit exceeded, discarding old layout. Please be more careful about discarding unused blocks.',
        )
        this.row = this.initialize(left, right)
      } else if (additionalLength > 0) {
        this.row.bits = this.row.bits.concat(new Array(additionalLength))
      }
    }

    // expand leftward if necessary
    if (left < this.row.offset) {
      // use math.min to avoid negative lengths
      const additionalLength = Math.min(currLength - oLeft, this.row.offset)
      if (this.row.bits.length + additionalLength > this.widthLimit) {
        console.warn(
          'Layout width limit exceeded, discarding old layout. Please be more careful about discarding unused blocks.',
        )

        this.row = this.initialize(left, right)
      } else {
        this.row.bits = new Array(additionalLength).concat(this.row.bits)
        this.row.offset -= additionalLength
      }
    }
    oRight = right - this.row.offset
    oLeft = left - this.row.offset
    const w = oRight - oLeft

    if (w > maxFeaturePitchWidth) {
      console.warn(
        `Layout X pitch set too low, feature spans ${w} bits in a single row.`,
        rect,
        data,
      )
    }

    for (let x = oLeft; x < oRight; x += 1) {
      this.row.bits[x] = data
    }

    if (left < this.row.min) {
      this.row.min = left
    }
    if (right > this.row.max) {
      this.row.max = right
    }
  }

  /**
   *  Given a range of interbase coordinates, deletes all data dealing with that range
   */
  discardRange(left: number, right: number): void {
    if (this.allFilled) {
      return
    } // allFilled is irrevocable currently

    // if we have no data, do nothing
    if (!this.row) {
      return
    }

    // if doesn't overlap at all, do nothing
    if (right <= this.row.min || left >= this.row.max) {
      return
    }

    // if completely encloses range, discard everything
    if (left <= this.row.min && right >= this.row.max) {
      this.row = undefined
      return
    }

    // if overlaps left edge, adjust the min
    if (right > this.row.min && left <= this.row.min) {
      this.row.min = right
    }

    // if overlaps right edge, adjust the max
    if (left < this.row.max && right >= this.row.max) {
      this.row.max = left
    }

    // now trim the left, right, or both sides of the array
    if (
      this.row.offset < this.row.min - minSizeToBotherWith &&
      this.row.bits.length >
        this.row.max + minSizeToBotherWith - this.row.offset
    ) {
      // trim both sides
      const leftTrimAmount = this.row.min - this.row.offset
      const rightTrimAmount =
        this.row.bits.length - 1 - (this.row.max - this.row.offset)
      // if (rightTrimAmount <= 0) debugger
      // if (leftTrimAmount <= 0) debugger
      // this.log(`trim both sides, ${leftTrimAmount} from left, ${rightTrimAmount} from right`)
      this.row.bits = this.row.bits.slice(
        leftTrimAmount,
        this.row.bits.length - rightTrimAmount,
      )
      this.row.offset += leftTrimAmount
      // if (this.row.offset > this.row.min) debugger
      // if (this.row.bits.length <= this.row.max - this.row.offset) debugger
    } else if (this.row.offset < this.row.min - minSizeToBotherWith) {
      // trim left side
      const desiredOffset = this.row.min - Math.floor(minSizeToBotherWith / 2)
      const trimAmount = desiredOffset - this.row.offset
      // this.log(`trim left side by ${trimAmount}`)
      this.row.bits.splice(0, trimAmount)
      this.row.offset += trimAmount
      // if (this.row.offset > this.row.min) debugger
      // if (this.row.bits.length <= this.row.max - this.row.offset) debugger
    } else if (
      this.row.bits.length >
      this.row.max - this.row.offset + minSizeToBotherWith
    ) {
      // trim right side
      const desiredLength =
        this.row.max - this.row.offset + 1 + Math.floor(minSizeToBotherWith / 2)
      this.row.bits.length = desiredLength
    }

    // if range now enclosed in the new bounds, loop through and clear the bits
    const oLeft = Math.max(this.row.min, left) - this.row.offset
    const oRight = Math.min(right, this.row.max) - this.row.offset
    for (let x = oLeft; x >= 0 && x < oRight; x += 1) {
      this.row.bits[x] = undefined
    }
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
    this.pTotalHeight = 0 // total height, in units of bitmap squares (px)
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

    let y = top
    const row = bitmap[y]
    if (row !== undefined && !row.isRangeClear(rect.l, rect.r)) {
      return true
    }

    return false
  }

  /**
   * make a subarray if it does not exist
   */
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

  /**
   *  Given a range of X coordinates, deletes all data dealing with
   *  the features.
   */
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
      const t = r.top as number
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
