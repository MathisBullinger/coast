import * as vec from './vec'
import Viewport from './viewport'
import Path from './path'

const svg = document.querySelector('svg')!

const initialVmin = 100000
const viewport = new Viewport(svg, initialVmin)

new Path(
  svg,
  viewport,
  [
    [-viewport.vMin / 2, 0],
    [viewport.vMin / 2, 0],
  ],
  (a, b) => {
    const half = vec.mul(vec.sub(b, a), 0.5)
    const c = vec.add(a, half)

    const offsetScale = Math.random() ** 2 * 0.5
    const offsetAngle = Math.random() * 2 * Math.PI
    const offset = vec.rotate(vec.mul(half, offsetScale), offsetAngle)

    return vec.add(c, offset)
  },
  6
)

svg.addEventListener('wheel', (e) => {
  e.preventDefault()

  if (!e.ctrlKey) {
    return pan(e.deltaX / svg.clientWidth, e.deltaY / svg.clientHeight)
  }

  const x = e.clientX / svg.clientWidth
  const y = e.clientY / svg.clientHeight
  const m = 1 + e.deltaY / 500

  zoom(m, [x, y])
})

svg.addEventListener('pointerdown', () => {
  const onMove = ({ movementX: x, movementY: y }: PointerEvent) => {
    pan(-x / svg.clientWidth, -y / svg.clientHeight)
  }

  svg.addEventListener('pointermove', onMove)

  window.addEventListener(
    'pointerup',
    () => svg.removeEventListener('pointermove', onMove),
    { once: true }
  )
})

const pan = (x: number, y: number) => {
  viewport.pan(x * viewport.width, y * viewport.height)
}

const zoom = (m: number, target: vec.Vec) => {
  viewport.zoom(m, target)
}
