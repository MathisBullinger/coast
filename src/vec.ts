export type Vec = [x: number, y: number]

export const mag = ([x, y]: Vec) => Math.sqrt(x ** 2 + y ** 2)
export const norm = (vec: Vec) => mul(vec, 1 / mag(vec))

export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]]
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]]

export const mul = ([x, y]: Vec, n: number): Vec => [x * n, y * n]
export const div = ([x, y]: Vec, n: number): Vec => [x / n, y / n]

export const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1]

export const rotate = ([x, y]: Vec, a: number): Vec => {
  const s = Math.sin(a)
  const c = Math.cos(a)

  return [x * c - y * s, x * s + y * c]
}

export const rotate90Deg = ([x, y]: Vec, clockwise: boolean): Vec =>
  clockwise ? [-y, x] : [y, -x]
