import type { RectTuple, Rectangle, BaseLayout } from './BaseLayout.ts'

export default class LeftArrayLayout<T> {
  ylim: number
  endArray: number[]
  rectangles = new Map<string, Rectangle<T>>()
  padding: number

  constructor(arg?: { padding?: number; ylim?: number }) {
    const { ylim = 1000, padding = 3 } = arg || {}
    this.ylim = ylim
    this.padding = padding
    this.endArray = new Array(ylim).fill(-Infinity)
  }

  findYPosition(startPosition: number) {
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
    const y = this.findYPosition(left)
    if (y !== -1) {
      this.endArray[y] = right
      this.rectangles.set(id, {
        l: left,
        r: right,
        top: y * height,
        h: height,
        id,
        data,
      })
      return y
    } else {
      return null
    }
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
