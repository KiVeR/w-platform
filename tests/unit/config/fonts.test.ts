import { FONT_CATALOG, fontFamilyValue, getFontOptions, SYSTEM_FONTS } from '@@/layers/editor/config/fonts'
import { describe, expect, it } from 'vitest'

// =============================================================================
// FONT_CATALOG structure
// =============================================================================

describe('font catalog', () => {
  it('has 24 fonts', () => {
    expect(FONT_CATALOG).toHaveLength(24)
  })

  it('each font has required fields', () => {
    for (const font of FONT_CATALOG) {
      expect(font.name).toBeTruthy()
      expect(typeof font.name).toBe('string')
      expect(['serif', 'sans-serif', 'display', 'monospace']).toContain(font.category)
      expect(['display', 'body', 'both']).toContain(font.usage)
      expect(font.weights).toBeInstanceOf(Array)
      expect(font.weights.length).toBeGreaterThan(0)
    }
  })

  it('has unique font names', () => {
    const names = FONT_CATALOG.map(f => f.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  it('all weights are valid numbers', () => {
    for (const font of FONT_CATALOG) {
      for (const weight of font.weights) {
        expect(typeof weight).toBe('number')
        expect(weight).toBeGreaterThanOrEqual(100)
        expect(weight).toBeLessThanOrEqual(900)
      }
    }
  })
})

// =============================================================================
// SYSTEM_FONTS
// =============================================================================

describe('system fonts', () => {
  it('contains Georgia', () => {
    expect(SYSTEM_FONTS).toContain('Georgia')
  })

  it('all system fonts exist in catalog', () => {
    const catalogNames = FONT_CATALOG.map(f => f.name)
    for (const systemFont of SYSTEM_FONTS) {
      expect(catalogNames).toContain(systemFont)
    }
  })
})

// =============================================================================
// fontFamilyValue
// =============================================================================

describe('fontFamilyValue', () => {
  it('returns font with its catalog category', () => {
    expect(fontFamilyValue('Inter')).toBe('Inter, sans-serif')
  })

  it('returns serif category for serif fonts', () => {
    expect(fontFamilyValue('Lora')).toBe('Lora, serif')
  })

  it('falls back to sans-serif for unknown font', () => {
    expect(fontFamilyValue('UnknownFont')).toBe('UnknownFont, sans-serif')
  })
})

// =============================================================================
// getFontOptions
// =============================================================================

describe('getFontOptions', () => {
  it('returns same number of options as catalog entries', () => {
    const options = getFontOptions()
    expect(options).toHaveLength(FONT_CATALOG.length)
  })

  it('each option has value and label', () => {
    const options = getFontOptions()
    for (const option of options) {
      expect(option.value).toBeTruthy()
      expect(option.label).toBeTruthy()
      expect(typeof option.value).toBe('string')
      expect(typeof option.label).toBe('string')
    }
  })

  it('labels match catalog font names', () => {
    const options = getFontOptions()
    const labels = options.map(o => o.label)
    const names = FONT_CATALOG.map(f => f.name)
    expect(labels).toEqual(names)
  })
})
