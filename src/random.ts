export function* mulberry32(seed = Math.random()): Generator<number, number> {
  while (true) {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    yield ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
