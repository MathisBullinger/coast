import * as vec from './vec'
import Viewport from './viewport'
import Path from './path'

const svg = document.querySelector('svg')!

const initialVmin = 100000
const viewport = new Viewport(svg, initialVmin)

const path = new Path(svg, [
  [-viewport.vMin / 2, 0],
  [viewport.vMin / 2, 0],
])

const segment = (path: Path) => {
  path.segments *= 2

  for (let i = 0; i < path.length - 1; i += 2) {
    const newPoint: vec.Vec = [
      path.at(i)[0] + (path.at(i + 1)[0] - path.at(i)[0]) / 2,
      path.at(i)[1] + (path.at(i + 1)[1] - path.at(i)[1]) / 2,
    ]

    const offsetScale = Math.random() ** 2 * 0.5
    const offsetAngle = Math.random() * 2 * Math.PI
    const offset = vec.mul(vec.sub(path.at(i + 1), newPoint), offsetScale)

    path.insert(i + 1, vec.add(newPoint, vec.rotate(offset, offsetAngle)))
  }
}

for (let i = 0; i < 6; i++) segment(path)
const intitialSegments = path.segments

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

  const lvl = Math.floor(Math.log2(2 * (initialVmin / viewport.vMin)))
  const act = Math.log2(2 * (path.segments / intitialSegments))
  if (lvl > act) segment(path)
}
