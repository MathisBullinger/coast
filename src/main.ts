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

const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
path.setAttribute('d', `M 0 ${minSize / 2} l ${minSize} 0`)
path.setAttribute('stroke', '#000')
path.setAttribute('vector-effect', 'non-scaling-stroke')
svg.appendChild(path)

const toSvgPath = (coords: vec.Vec[]) =>
  'M ' +
  coords
    .reduceRight(
      (a, c, i) =>
        i === 0
          ? [c, ...a]
          : [
              [c[0] - coords[i - 1][0], c[1] - coords[i - 1][1]] as vec.Vec,
              ...a,
            ],
      [] as vec.Vec[]
    )
    .map((point) => point.join(' '))
    .join(' l ')

const segment = () => {
  segments *= 2

  let coords = path
    .getAttribute('d')!
    .slice(2)
    .split(' l ')
    .map((v) => v.split(' ').map((v) => parseFloat(v)) as vec.Vec)

  for (let i = 1; i < coords.length; i++) {
    coords[i][0] += coords[i - 1][0]
    coords[i][1] += coords[i - 1][1]
  }

  coords = coords.flatMap((p, i) => {
    if (i === coords.length - 1) return [p]

    const v: vec.Vec = [
      p[0] + (coords[i + 1][0] - p[0]) / 2,
      p[1] + (coords[i + 1][1] - p[1]) / 2,
    ]

    const offsetMag = Math.random() ** 2 * 0.5 * vec.mag(vec.sub(v, p))
    const offset = vec.rotate([0, offsetMag], Math.random() * 2 * Math.PI)

    return [p, vec.add(v, offset)]
  })

  path.setAttribute('d', toSvgPath(coords))
}

let segments = 1
for (let i = 0; i < 7; i++) segment()
const intitialSegments = segments

type ViewPort = { x: number; y: number; w: number; h: number }

svg.addEventListener('wheel', (e) => {
  e.preventDefault()
  if (!e.ctrlKey) return

  const x = e.clientX / svg.clientWidth
  const y = e.clientY / svg.clientHeight
  const m = 1 + e.deltaY / 500

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

  const act = Math.log2(2 * (segments / intitialSegments))

  if (lvl > act) segment()
})
