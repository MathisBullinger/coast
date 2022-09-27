import { Vec } from './vec'

export default class ViewPort {
  private x: number
  private y: number
  private w: number
  private h: number

  constructor(
    private readonly svg: SVGElement,
    vMin = 1000,
    center: Vec = [0, 0]
  ) {
    const svgMin = Math.min(svg.clientWidth, svg.clientHeight)
    this.w = (svg.clientWidth / svgMin) * vMin
    this.h = (svg.clientHeight / svgMin) * vMin
    this.x = center[0] - this.w / 2
    this.y = center[1] - this.h / 2
    this.setViewbox()

    new ResizeObserver(this.onResize.bind(this)).observe(
      this.svg.parentElement!
    )
  }

  public get vMin() {
    return Math.min(this.w, this.h)
  }

  public get vMax() {
    return Math.max(this.w, this.h)
  }

  public get width() {
    return this.w
  }

  public get height() {
    return this.h
  }

  public pan(x: number, y: number) {
    this.x += x
    this.y += y
    this.setViewbox()

    console.log(this.x / this.width, this.y / this.height)
  }

  public zoom(m: number, [x, y]: Vec = [0.5, 0.5]) {
    this.x += (this.w - this.w * m) * x
    this.y += (this.h - this.h * m) * y
    this.w *= m
    this.h *= m
    this.setViewbox()
  }

  private setViewbox() {
    this.svg.setAttribute('viewBox', `${this.x} ${this.y} ${this.w} ${this.h}`)
  }

  private onResize() {
    const dim = [
      ['w', 'clientWidth'],
      ['h', 'clientHeight'],
    ] as const
    const minI = this.svg.clientWidth < this.svg.clientHeight ? 0 : 1
    const [min, svgMin] = dim[minI]
    const [max, svgMax] = dim[+!minI]

    this[min] = this.vMin
    this[max] = (this.svg[svgMax] / this.svg[svgMin]) * this[min]
    this.setViewbox()
  }
}
