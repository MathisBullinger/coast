import * as vec from './vec'
import type { Vec } from './vec'

export type Polygon = Vec[]
export type Interval = [start: number, end: number]

export const collide = (
  a: Polygon,
  b: Polygon,
  axes: Vec[] = [...getAxes(a), ...getAxes(b)]
): boolean => {
  for (let axis of axes) {
    const [aMin, aMax] = project(a, axis)
    const [bMin, bMax] = project(b, axis)
    if (aMin > bMax || bMin > aMax) return false
  }
  return true
}

export const getAxes = (polygon: Polygon): Vec[] => {
  const axes: Vec[] = [vec.sub(polygon[0], polygon[polygon.length - 1])]
  for (let i = 0; i < polygon.length - 1; i++)
    axes.push(vec.sub(polygon[i + 1], polygon[i]))
  return axes.map(vec.norm)
}

export const project = (polygon: Polygon, axis: Vec): Interval => {
  let min = Infinity
  let max = -Infinity
  for (let point of polygon) {
    const v = vec.dot(point, axis)
    if (v < min) min = v
    if (v > max) max = v
  }
  return [min, max]
}
