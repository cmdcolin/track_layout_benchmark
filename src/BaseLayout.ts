export type RectTuple = [number, number, number, number]
export interface SerializedLayout {
  rectangles: Record<string, RectTuple>
  totalHeight: number
  containsNoTransferables: true
  maxHeightReached: boolean
}
export interface Rectangle<T> {
  id: string
  l: number
  r: number
  top: number | null
  h: number
  data?: T
}

export interface BaseLayout<T> {
  addRect(
    id: string,
    left: number,
    right: number,
    height: number,
    data?: unknown,
  ): number | null
  collides(rect: Rectangle<T>, top: number): boolean
  addRectToBitmap(rect: Rectangle<T>, data: unknown): void
  discardRange(left: number, right: number): void
  getTotalHeight(): number
  maxHeightReached: boolean
}
