import * as vec from './vec'
import type { Vec } from './vec'
import type ViewPort from './viewport'

type Opts = {
  svgs: SVGElement[]
  viewport: ViewPort
  points: Vec[]
  interpolationFunction: (a: Vec, b: Vec, lvl: number) => Vec
  segmentLevels?: number
  showMarkers?: boolean
  autoSegment?: boolean
}

export default class Path {
  private readonly svgPaths: SVGPathElement[] = []

  private readonly interpolationFunction: Opts['interpolationFunction']
  private readonly viewport: Opts['viewport']
  private coords: { stringIndex: number; x: number; y: number }[] = []
  private svgD = ''
  private initialVmin: number
  private readonly initialSegmentCount: number

  constructor({
    svgs,
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

    const { svgD, coords } = Path.getSvgPath(points)
    this.coords = coords
    this.svgD = svgD

    for (let i = 0; i < svgs.length; i++) {
      const path = this.createSvgPath(showMarkers)
      path.setAttribute('d', svgD)
      svgs[i].appendChild(path)
      this.svgPaths.push(path)
    }

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

    this.viewport.addEventListener('pan', this.checkInViewport.bind(this))

    this.fillDetail()
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

  private checkInViewport() {
    const checkExpansion = (a: Vec, b: Vec, expandClockwise: boolean) => {
      const dh = vec.mul(vec.sub(b, a), 0.5)
      const c = vec.add(
        vec.add(a, dh),
        vec.rotate90Deg(vec.mul(dh, 0.5), expandClockwise)
      )
      const expansionArea = [a, b, c]
      return this.viewport.intersects(expansionArea)
    }

    const testRec = (
      first = 0,
      last = this.coords.length - 1,
      clockwise = false
    ) => {
      const collides = checkExpansion(
        this.getCoord(first),
        this.getCoord(last),
        clockwise
      )

      // console.log(collides)
      if (!collides) return false

      console.log('collide', first, last)
    }

    testRec()
  }

  private fillDetail() {
    // const lvl = Math.floor(
    //   Math.log2(2 * (this.initialVmin / this.viewport.vMin))
    // )
    // const segments = 2 ** (lvl + 4)
    // console.log(segments)
  }

  private getCoord(i: number): Vec {
    return [this.coords[i].x, this.coords[i].y]
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

    const svgD = this.svgD
    for (const path of this.svgPaths) path.setAttribute('d', svgD)

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
