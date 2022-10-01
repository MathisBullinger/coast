import type { Vec } from './vec'
import type ViewPort from './viewport'

type Opts = {
  svg: SVGElement
  viewport: ViewPort
  points: Vec[]
  interpolationFunction: (a: Vec, b: Vec, lvl: number) => Vec
  segmentLevels?: number
  showMarkers?: boolean
  autoSegment?: boolean
}

export default class Path {
  private readonly svgPath: SVGPathElement

  private readonly interpolationFunction: Opts['interpolationFunction']
  private readonly viewport: Opts['viewport']
  private coords: { stringIndex: number; x: number; y: number }[] = []
  private svgD = ''
  private initialVmin: number
  private readonly initialSegmentCount: number

  constructor({
    svg,
    viewport,
    points,
    interpolationFunction,
    segmentLevels = 1,
    showMarkers = false,
    autoSegment = true,
  }: Opts) {
    this.interpolationFunction = interpolationFunction
    this.viewport = viewport
    this.initialVmin = viewport.vMin

    this.svgPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    this.svgPath.setAttribute('stroke', '#000')
    this.svgPath.setAttribute('vector-effect', 'non-scaling-stroke')

    if (showMarkers) {
      this.svgPath.setAttribute('marker-start', 'url(#dot)')
      this.svgPath.setAttribute('marker-mid', 'url(#dot)')
      this.svgPath.setAttribute('marker-end', 'url(#dot)')
    }

    const { svgD, coords } = Path.getSvgPath(points)
    this.coords = coords
    this.svgD = svgD
    this.svgPath.setAttribute('d', svgD)
    svg.appendChild(this.svgPath)

    for (let i = 1; i < segmentLevels; i++) this.addSegments()
    this.initialSegmentCount = this.coords.length - 1

    if (autoSegment) {
      this.viewport.addEventListener('resize', ({ vMin }) => {
        const lvl = Math.floor(
          Math.log2(2 * (this.initialVmin / viewport.vMin))
        )
        const act = Math.log2(
          2 * ((this.coords.length - 1) / this.initialSegmentCount)
        )
        if (lvl > act) this.addSegments()
      })
    }
  }

  public addSegments() {
    const lvl = Math.log2(this.coords.length - 1)

    for (let i = 0; i < this.length - 1; i += 2) {
      this.insert(
        i + 1,
        this.interpolationFunction(this.at(i), this.at(i + 1), lvl)
      )
    }

    console.log(lvl + 1, this.coords.length)
  }

  public get length() {
    return this.coords.length
  }

  public at(index: number): Vec {
    return [this.coords[index].x, this.coords[index].y]
  }

  public insert(index: number, [x, y]: Vec) {
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

  private static getSvgPath(points: Vec[]) {
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
