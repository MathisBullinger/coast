import * as vec from './vec'

const svg = document.querySelector('svg')!

let viewBox: ViewPort = { x: 0, y: 0, w: 0, h: 0 }

const applyViewBox = () => {
  svg.setAttribute(
    'viewBox',
    `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`
  )
}

const minSize = 100000
{
  viewBox.w =
    (svg.clientWidth / Math.min(svg.clientWidth, svg.clientHeight)) * minSize
  viewBox.h =
    (svg.clientHeight / Math.min(svg.clientWidth, svg.clientHeight)) * minSize
  viewBox.x = (minSize - viewBox.w) / 2
  viewBox.y = (minSize - viewBox.h) / 2

  applyViewBox()
}

class Path {
  private readonly svgPath: SVGPathElement
  public segments = 0

  private coords: { stringIndex: number; x: number; y: number }[] = []
  private svgD = ''

  constructor(points: vec.Vec[]) {
    this.svgPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    this.svgPath.setAttribute('stroke', '#000')
    this.svgPath.setAttribute('vector-effect', 'non-scaling-stroke')
    const { svgD, coords } = Path.getSvgPath(points)
    this.coords = coords
    this.svgD = svgD
    this.svgPath.setAttribute('d', svgD)
    svg.appendChild(this.svgPath)
    this.segments = points.length
  }

  public get length() {
    return this.coords.length
  }

  public at(index: number): vec.Vec {
    return [this.coords[index].x, this.coords[index].y]
  }

  public insert(index: number, [x, y]: vec.Vec) {
    const svgDSeg = `${index ? 'L' : 'M'} ${x} ${y} `

    if (index >= this.coords.length) {
      this.coords.push({
        x,
        y,
        stringIndex: this.svgD.length,
      })
      this.svgD = `${svgDSeg}L ${this.svgD.slice(2)}`
    } else if (index === 0) {
      this.coords.unshift({ x, y, stringIndex: 0 })
      this.svgD += svgDSeg
    } else {
      const stringIndex = this.coords[index].stringIndex
      this.coords = [
        ...this.coords.slice(0, index),
        { x, y, stringIndex },
        ...this.coords.slice(index),
      ]
      this.svgD =
        this.svgD.slice(0, stringIndex) + svgDSeg + this.svgD.slice(stringIndex)
    }

    this.svgPath.setAttribute('d', this.svgD)

    for (let i = index + 1; i < this.coords.length; i++) {
      this.coords[i].stringIndex += svgDSeg.length
    }
  }

  private static getSvgPath(points: vec.Vec[]) {
    let svgD = ''
    let coords: Path['coords'] = []
    if (!points.length) return { svgD, coords }

    svgD = `M ${points[0][0]} ${points[0][1]} `
    coords = [{ x: points[0][0], y: points[0][1], stringIndex: 0 }]

    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i]
      coords.push({ x, y, stringIndex: svgD.length })
      svgD += `L ${x} ${y} `
    }

    return { svgD, coords }
  }
}

const path = new Path([
  [0, minSize / 2],
  [minSize, minSize / 2],
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

type ViewPort = { x: number; y: number; w: number; h: number }

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
  viewBox.x += viewBox.w * x
  viewBox.y += viewBox.h * y
  applyViewBox()
}

const zoom = (m: number, [x, y]: vec.Vec) => {
  const newViewBox = { ...viewBox }
  newViewBox.w *= m
  newViewBox.h *= m
  newViewBox.x += (viewBox.w - newViewBox.w) * x
  newViewBox.y += (viewBox.h - newViewBox.h) * y

  viewBox = newViewBox
  applyViewBox()

  const lvl = Math.floor(
    Math.log2(2 * (minSize / Math.min(viewBox.w, viewBox.h)))
  )

  const act = Math.log2(2 * (path.segments / intitialSegments))

  if (lvl > act) segment(path)
}
