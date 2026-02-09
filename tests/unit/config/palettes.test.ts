import { getPaletteByName, palettes } from '@@/layers/editor/config/palettes'
import { describe, expect, it } from 'vitest'

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/

// =============================================================================
// palettes structure
// =============================================================================

describe('palettes', () => {
  it('has 8 palettes', () => {
    expect(palettes).toHaveLength(8)
  })

  it('each palette has required string fields', () => {
    for (const palette of palettes) {
      expect(palette.name).toBeTruthy()
      expect(typeof palette.name).toBe('string')
      expect(palette.label).toBeTruthy()
      expect(typeof palette.label).toBe('string')
    }
  })

  it('each palette has valid hex colors', () => {
    for (const palette of palettes) {
      expect(palette.primary).toMatch(HEX_COLOR_REGEX)
      expect(palette.primaryDark).toMatch(HEX_COLOR_REGEX)
      expect(palette.background).toMatch(HEX_COLOR_REGEX)
      expect(palette.text).toMatch(HEX_COLOR_REGEX)
    }
  })

  it('has unique palette names', () => {
    const names = palettes.map(p => p.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  it('dark palettes have isDark set to true', () => {
    const darkPalettes = palettes.filter(p => p.isDark)
    expect(darkPalettes.length).toBeGreaterThan(0)
    for (const palette of darkPalettes) {
      expect(palette.isDark).toBe(true)
    }
  })

  it('contains expected palette names', () => {
    const names = palettes.map(p => p.name)
    expect(names).toContain('turquoise')
    expect(names).toContain('midnight')
    expect(names).toContain('charcoal')
  })
})

// =============================================================================
// getPaletteByName
// =============================================================================

describe('getPaletteByName', () => {
  it('returns correct palette for known name', () => {
    const palette = getPaletteByName('turquoise')
    expect(palette).toBeDefined()
    expect(palette?.name).toBe('turquoise')
    expect(palette?.label).toBe('Turquoise')
  })

  it('returns undefined for unknown name', () => {
    expect(getPaletteByName('nonexistent')).toBeUndefined()
  })
})
