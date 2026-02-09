/**
 * Normalizes a hex color to lowercase 6-character format.
 * Converts shorthand (#fff) to full format (#ffffff).
 */
export function normalizeHexColor(color: string | undefined): string {
  if (!color)
    return ''

  let hex = color.trim().toLowerCase()

  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }

  if (!/^#[0-9a-f]{6}$/.test(hex)) {
    console.warn(`Invalid hex color format: ${color}`)
    return color
  }

  return hex
}

/** Compares two hex colors for equality after normalization. */
export function colorsEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a && !b)
    return true
  if (!a || !b)
    return false
  return normalizeHexColor(a) === normalizeHexColor(b)
}

/** Determines if a color is dark based on WCAG luminance formula. */
export function isDarkColor(backgroundColor: string): boolean {
  const hex = normalizeHexColor(backgroundColor)
  if (!hex || hex.length !== 7)
    return false

  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

/** Converts a hex color (#rrggbb or #rgb) to HSL values. */
export function hexToHSL(hex: string): { h: number, s: number, l: number } {
  const normalized = normalizeHexColor(hex)
  if (!normalized || !/^#[0-9a-f]{6}$/.test(normalized))
    return { h: 0, s: 0, l: 0 }

  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min)
    return { h: 0, s: 0, l: Math.round(l * 100) }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === r)
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g)
    h = ((b - r) / d + 2) / 6
  else
    h = ((r - g) / d + 4) / 6

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/** Converts HSL values (h: 0-360, s: 0-100, l: 0-100) to a hex color string. */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100
  const lNorm = l / 100

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = c
    g = x
    b = 0
  }
  else if (h < 120) {
    r = x
    g = c
    b = 0
  }
  else if (h < 180) {
    r = 0
    g = c
    b = x
  }
  else if (h < 240) {
    r = 0
    g = x
    b = c
  }
  else if (h < 300) {
    r = x
    g = 0
    b = c
  }
  else {
    r = c
    g = 0
    b = x
  }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Generates a hash string from colors for memoization. */
export function colorHash(colors: Record<string, string | undefined>): string {
  return Object.entries(colors)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${normalizeHexColor(value)}`)
    .join('|')
}
