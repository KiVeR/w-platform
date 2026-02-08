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

/** Generates a hash string from colors for memoization. */
export function colorHash(colors: Record<string, string | undefined>): string {
  return Object.entries(colors)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${normalizeHexColor(value)}`)
    .join('|')
}
