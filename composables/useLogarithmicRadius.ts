/**
 * Logarithmic radius slider mapping.
 *
 * Internal slider operates on 0-100. Mapped to km via piecewise linear interpolation:
 *   Position  0-40  → 1-5 km   (snap 0.5)
 *   Position 40-70  → 5-15 km  (snap 1)
 *   Position 70-100 → 15-50 km (snap 5)
 */

interface Breakpoint {
  pos: number
  km: number
}

const BREAKPOINTS: Breakpoint[] = [
  { pos: 0, km: 1 },
  { pos: 40, km: 5 },
  { pos: 70, km: 15 },
  { pos: 100, km: 50 },
]

function interpolate(value: number, srcMin: number, srcMax: number, dstMin: number, dstMax: number): number {
  const ratio = (value - srcMin) / (srcMax - srcMin)
  return dstMin + ratio * (dstMax - dstMin)
}

export function snapToStep(km: number): number {
  if (km <= 5) return Math.round(km * 2) / 2
  if (km <= 15) return Math.round(km)
  return Math.round(km / 5) * 5
}

export function sliderToKm(position: number): number {
  const clamped = Math.max(0, Math.min(100, position))

  for (let i = 0; i < BREAKPOINTS.length - 1; i++) {
    const curr = BREAKPOINTS[i]
    const next = BREAKPOINTS[i + 1]
    if (clamped >= curr.pos && clamped <= next.pos) {
      const raw = interpolate(clamped, curr.pos, next.pos, curr.km, next.km)
      return snapToStep(raw)
    }
  }

  return BREAKPOINTS[BREAKPOINTS.length - 1].km
}

export function kmToSlider(km: number): number {
  const clamped = Math.max(1, Math.min(50, km))

  for (let i = 0; i < BREAKPOINTS.length - 1; i++) {
    const curr = BREAKPOINTS[i]
    const next = BREAKPOINTS[i + 1]
    if (clamped >= curr.km && clamped <= next.km) {
      return Math.round(interpolate(clamped, curr.km, next.km, curr.pos, next.pos))
    }
  }

  return BREAKPOINTS[BREAKPOINTS.length - 1].pos
}
