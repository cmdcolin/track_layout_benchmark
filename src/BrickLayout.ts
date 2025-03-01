export default class BrickLayout {
  private readonly maxHeight: number
  private readonly heights: Map<number, number>
  private readonly bricks: Map<
    string,
    { left: number; right: number; top: number; height: number }
  >

  constructor({ maxHeight }: { maxHeight: number }) {
    this.maxHeight = maxHeight
    this.heights = new Map() // Maps x-coordinate to current height
    this.bricks = new Map() // Stores brick positions for potential future use
  }

  /**
   *
   * @param id - the id of the brick
   * @param left - the leftmost x coordinate of the rectangle
   * @param right - the rightmost x coordinate of the rectangle
   * @param height - the height of the rectangle
   * @returns top position for the rect, or null if laying out the rect would exceed maxHeight
   */
  addRect(
    id: string,
    left: number,
    right: number,
    height: number,
  ): number | null {
    // Find the maximum height in the range [left, right)
    let maxHeightInRange = 0
    for (let x = left; x < right; x++) {
      maxHeightInRange = Math.max(maxHeightInRange, this.heights.get(x) || 0)
    }

    const newTop = maxHeightInRange

    // Check if adding this brick would exceed maxHeight
    if (newTop + height > this.maxHeight) {
      return null
    }

    // Update heights for the entire width of the brick
    for (let x = left; x < right; x++) {
      this.heights.set(x, newTop + height)
    }

    // Store the brick's position
    this.bricks.set(id, { left, right, top: newTop, height })

    return newTop
  }

  getRectangles(): Map<string, RectTuple> {
    return new Map(
      Array.from(this.bricks.entries()).map(([id, rect]) => {
        const { left: l, right: r, height: h, top } = rect
        const t = top || 0
        const b = t + h
        return [id, [l, t, r, b]] // left, top, right, bottom
      }),
    )
  }
}
