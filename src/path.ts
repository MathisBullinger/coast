import type { Vec } from './vec'
import type ViewPort from './viewport'

class Segment {
  private readonly points: [Vec, Vec, Vec]
  private children?: [Segment, Segment]
  private wasEntirelyVisile = false
  private segmentations = 0
  private pathLeft = ''
  private pathRight = ''
  public pathD = ''

  constructor(
    readonly start: Vec,
    readonly end: Vec,
    private readonly viewport: ViewPort,
    private readonly interFun: InterpolationFunction,
    private readonly lvl = 0
  ) {
    this.points = [start, interFun(start, end, lvl), end]
    this.pathD = this.getOwnPath()
  }

  public segment(lvl: number): boolean {
    const isEntirelyVisible = this.isEntirelyVisible()
    const wasEntirelyVisile = this.wasEntirelyVisile
    this.wasEntirelyVisile = isEntirelyVisible

    if (isEntirelyVisible && wasEntirelyVisile && this.segmentations === lvl) {
      return false
    }

    this.segmentations = lvl

    if (lvl <= 0 || !this.isVisible()) {
      if (this.children) {
        delete this.children
        this.pathLeft = this.pathRight = ''
        this.pathD = this.getOwnPath()
        return true
      }
      return false
    }

    let hasChanged = false

    if (!this.children) {
      this.children = [
        new Segment(
          this.points[0],
          this.points[1],
          this.viewport,
          this.interFun,
          this.lvl + 1
        ),
        new Segment(
          this.points[1],
          this.points[2],
          this.viewport,
          this.interFun,
          this.lvl + 1
        ),
      ]
      this.pathLeft = this.children[0].pathD
      this.pathRight = this.children[1].pathD
      hasChanged = true
    }

    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].segment(lvl - 1)) {
        this[i ? 'pathRight' : 'pathLeft'] = this.children[i].pathD
        hasChanged = true
      }
    }

    if (hasChanged) {
      this.pathD = this.pathLeft + this.pathRight
      if (this.lvl === 0)
        this.pathD = `M ${this.points[0][0]} ${this.points[0][1]}` + this.pathD
    }

    return hasChanged
  }

  private isVisible() {
    return this.viewport.intersects(this.points)
  }

  private isEntirelyVisible() {
    for (const point of this.points) {
      if (!this.viewport.contains(point)) return false
    }
    return true
  }

  private getOwnPath() {
    let path = ` L ${this.points[2][0]} ${this.points[2][1]}`
    if (this.lvl === 0) {
      path = `M ${this.points[0][0]} ${this.points[0][1]}` + path
    }
    return path
  }
}

type Opts = {
  svgs: SVGElement[]
  viewport: ViewPort
  start: Vec
  end: Vec
  interpolationFunction: InterpolationFunction
  showMarkers?: boolean
}

type InterpolationFunction = (a: Vec, b: Vec, lvl: number) => Vec

export default class Path {
  private readonly svgPaths: SVGPathElement[] = []

  private readonly viewport: Opts['viewport']
  private initialVmin: number

  private root: Segment

  constructor({
    svgs,
    viewport,
    start,
    end,
    interpolationFunction,
    showMarkers = false,
  }: Opts) {
    this.viewport = viewport
    this.initialVmin = viewport.vMin

    this.root = new Segment(start, end, viewport, interpolationFunction)

    for (let i = 0; i < svgs.length; i++) {
      const path = this.createSvgPath(showMarkers)
      svgs[i].appendChild(path)
      this.svgPaths.push(path)
    }

    this.setSvgD()

    this.fillDetail = this.fillDetail.bind(this)
    this.viewport.addEventListener('pan', this.fillDetail)
    this.viewport.addEventListener('resize', this.fillDetail)
    this.fillDetail()
  }

  private setSvgD() {
    const svgD = this.root.pathD
    console.log(svgD.length)
    for (const path of this.svgPaths) {
      path.setAttribute('d', svgD)
    }
  }

  private createSvgPath(showMarkers = false) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('stroke', '#000')
    path.setAttribute('vector-effect', 'non-scaling-stroke')

    if (showMarkers) {
      path.setAttribute('marker-start', 'url(#dot)')
      path.setAttribute('marker-mid', 'url(#dot)')
      path.setAttribute('marker-end', 'url(#dot)')
    }

    return path
  }

  private fillDetail() {
    const maxLvl =
      Math.floor(Math.log2(2 * (this.initialVmin / this.viewport.vMin))) * 6

    if (this.root.segment(maxLvl)) {
      this.setSvgD()
    }
  }
}
