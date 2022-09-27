import { Vec } from './vec'

export default class Path {
  private readonly svgPath: SVGPathElement
  public segments = 0

  private coords: { stringIndex: number; x: number; y: number }[] = []
  private svgD = ''

  constructor(private readonly svg: SVGElement, points: Vec[]) {
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
