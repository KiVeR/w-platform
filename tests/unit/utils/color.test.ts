import { colorHash, colorsEqual, hexToHSL, hslToHex, isDarkColor, normalizeHexColor } from '@@/layers/editor/utils/color'
import { describe, expect, it, vi } from 'vitest'

// =============================================================================
// normalizeHexColor
// =============================================================================

describe('normalizeHexColor', () => {
  it('returns empty string for undefined', () => {
    expect(normalizeHexColor(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(normalizeHexColor('')).toBe('')
  })

  it('expands shorthand #fff to #ffffff', () => {
    expect(normalizeHexColor('#fff')).toBe('#ffffff')
  })

  it('expands shorthand #abc to #aabbcc', () => {
    expect(normalizeHexColor('#abc')).toBe('#aabbcc')
  })

  it('lowercases uppercase hex #FFFFFF', () => {
    expect(normalizeHexColor('#FFFFFF')).toBe('#ffffff')
  })

  it('lowercases mixed case #AaBbCc', () => {
    expect(normalizeHexColor('#AaBbCc')).toBe('#aabbcc')
  })

  it('passes through valid lowercase 6-char hex', () => {
    expect(normalizeHexColor('#1a2b3c')).toBe('#1a2b3c')
  })

  it('trims whitespace around the color', () => {
    expect(normalizeHexColor('  #fff  ')).toBe('#ffffff')
  })

  it('returns original and warns for invalid format', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = normalizeHexColor('not-a-color')
    expect(result).toBe('not-a-color')
    expect(warnSpy).toHaveBeenCalledWith('Invalid hex color format: not-a-color')
  })

  it('returns original and warns for hex without hash', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = normalizeHexColor('ffffff')
    expect(result).toBe('ffffff')
    expect(warnSpy).toHaveBeenCalled()
  })
})

// =============================================================================
// colorsEqual
// =============================================================================

describe('colorsEqual', () => {
  it('returns true when both are undefined', () => {
    expect(colorsEqual(undefined, undefined)).toBe(true)
  })

  it('returns false when first is undefined', () => {
    expect(colorsEqual(undefined, '#fff')).toBe(false)
  })

  it('returns false when second is undefined', () => {
    expect(colorsEqual('#fff', undefined)).toBe(false)
  })

  it('returns true for same color in different formats', () => {
    expect(colorsEqual('#fff', '#ffffff')).toBe(true)
  })

  it('returns true for same color in different cases', () => {
    expect(colorsEqual('#AABBCC', '#aabbcc')).toBe(true)
  })

  it('returns false for different colors', () => {
    expect(colorsEqual('#000000', '#ffffff')).toBe(false)
  })
})

// =============================================================================
// isDarkColor
// =============================================================================

describe('isDarkColor', () => {
  it('returns true for black (#000000)', () => {
    expect(isDarkColor('#000000')).toBe(true)
  })

  it('returns false for white (#ffffff)', () => {
    expect(isDarkColor('#ffffff')).toBe(false)
  })

  it('returns true for dark blue (#0f172a)', () => {
    expect(isDarkColor('#0f172a')).toBe(true)
  })

  it('returns false for light gray (#f8fafc)', () => {
    expect(isDarkColor('#f8fafc')).toBe(false)
  })

  it('handles shorthand hex (#000)', () => {
    expect(isDarkColor('#000')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isDarkColor('')).toBe(false)
  })

  it('returns false for invalid color', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(isDarkColor('invalid')).toBe(false)
  })
})

// =============================================================================
// colorHash
// =============================================================================

describe('colorHash', () => {
  it('produces deterministic output', () => {
    const colors = { primary: '#fff', background: '#000' }
    const hash1 = colorHash(colors)
    const hash2 = colorHash(colors)
    expect(hash1).toBe(hash2)
  })

  it('sorts keys alphabetically', () => {
    const hash1 = colorHash({ b: '#fff', a: '#000' })
    const hash2 = colorHash({ a: '#000', b: '#fff' })
    expect(hash1).toBe(hash2)
  })

  it('normalizes color values', () => {
    const hash1 = colorHash({ color: '#fff' })
    const hash2 = colorHash({ color: '#ffffff' })
    expect(hash1).toBe(hash2)
  })

  it('handles undefined values', () => {
    const hash = colorHash({ color: undefined })
    expect(hash).toBe('color:')
  })

  it('produces different hashes for different colors', () => {
    const hash1 = colorHash({ color: '#000000' })
    const hash2 = colorHash({ color: '#ffffff' })
    expect(hash1).not.toBe(hash2)
  })
})

// =============================================================================
// hexToHSL
// =============================================================================

describe('hexToHSL', () => {
  it('converts pure red to HSL', () => {
    const { h, s, l } = hexToHSL('#ff0000')
    expect(h).toBe(0)
    expect(s).toBe(100)
    expect(l).toBe(50)
  })

  it('converts pure green to HSL', () => {
    const { h, s, l } = hexToHSL('#00ff00')
    expect(h).toBe(120)
    expect(s).toBe(100)
    expect(l).toBe(50)
  })

  it('converts pure blue to HSL', () => {
    const { h, s, l } = hexToHSL('#0000ff')
    expect(h).toBe(240)
    expect(s).toBe(100)
    expect(l).toBe(50)
  })

  it('converts white to HSL', () => {
    const { h, s, l } = hexToHSL('#ffffff')
    expect(h).toBe(0)
    expect(s).toBe(0)
    expect(l).toBe(100)
  })

  it('converts black to HSL', () => {
    const { h, s, l } = hexToHSL('#000000')
    expect(h).toBe(0)
    expect(s).toBe(0)
    expect(l).toBe(0)
  })

  it('converts turquoise primary (#14b8a6) correctly', () => {
    const { h, s, l } = hexToHSL('#14b8a6')
    // Turquoise: hue ~174, saturation ~80%, lightness ~40%
    expect(h).toBeGreaterThanOrEqual(170)
    expect(h).toBeLessThanOrEqual(178)
    expect(s).toBeGreaterThanOrEqual(75)
    expect(l).toBeGreaterThanOrEqual(35)
    expect(l).toBeLessThanOrEqual(45)
  })

  it('handles shorthand hex (#fff)', () => {
    const { l } = hexToHSL('#fff')
    expect(l).toBe(100)
  })

  it('returns zeros for invalid input', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { h, s, l } = hexToHSL('invalid')
    expect(h).toBe(0)
    expect(s).toBe(0)
    expect(l).toBe(0)
  })
})

// =============================================================================
// hslToHex
// =============================================================================

describe('hslToHex', () => {
  it('converts pure red HSL to hex', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000')
  })

  it('converts pure green HSL to hex', () => {
    expect(hslToHex(120, 100, 50)).toBe('#00ff00')
  })

  it('converts pure blue HSL to hex', () => {
    expect(hslToHex(240, 100, 50)).toBe('#0000ff')
  })

  it('converts white HSL to hex', () => {
    expect(hslToHex(0, 0, 100)).toBe('#ffffff')
  })

  it('converts black HSL to hex', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000')
  })

  it('converts mid-gray HSL to hex', () => {
    const hex = hslToHex(0, 0, 50)
    expect(hex).toBe('#808080')
  })
})

// =============================================================================
// hexToHSL + hslToHex round-trip
// =============================================================================

describe('hexToHSL / hslToHex round-trip', () => {
  const testColors = [
    '#14b8a6', // turquoise primary
    '#3b82f6', // blue info
    '#ef4444', // red error
    '#f59e0b', // amber warning
    '#22c55e', // green success
    '#1e293b', // dark neutral
    '#f1f5f9', // light neutral
    '#ff00ff', // magenta
    '#808080', // gray
  ]

  for (const color of testColors) {
    it(`round-trips ${color}`, () => {
      const hsl = hexToHSL(color)
      const result = hslToHex(hsl.h, hsl.s, hsl.l)
      // Due to rounding, allow ±2 per channel
      const parseHex = (hex: string) => [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16),
      ]
      const [r1, g1, b1] = parseHex(color)
      const [r2, g2, b2] = parseHex(result)
      expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(2)
      expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(2)
      expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(2)
    })
  }
})
