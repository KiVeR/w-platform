import { hexToHSL, hslToHex } from '@@/layers/editor/utils/color'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stubEditorConfig } from '../../helpers/stubs'

// Stub onScopeDispose (Nuxt auto-import, not in our global setup)
vi.stubGlobal('onScopeDispose', vi.fn())

// Stub hexToHSL and hslToHex as auto-imports
vi.stubGlobal('hexToHSL', hexToHSL)
vi.stubGlobal('hslToHex', hslToHex)

const { useEditorTheme } = await import('#editor/composables/useEditorTheme')

describe('useEditorTheme', () => {
  beforeEach(() => {
    // Clean up any style properties set on documentElement
    const el = document.documentElement
    const style = el.getAttribute('style')
    if (style) {
      el.removeAttribute('style')
    }
  })

  it('returns default turquoise primaryColor when no theme provided', () => {
    stubEditorConfig()
    const { primaryColor, isCustomTheme } = useEditorTheme()
    expect(primaryColor.value).toBe('#14b8a6')
    expect(isCustomTheme.value).toBe(false)
  })

  it('returns custom primaryColor when theme is provided', () => {
    stubEditorConfig({ theme: { primaryColor: '#3b82f6' } })
    const { primaryColor, isCustomTheme } = useEditorTheme()
    expect(primaryColor.value).toBe('#3b82f6')
    expect(isCustomTheme.value).toBe(true)
  })

  it('returns logo from config', () => {
    const logo = { src: '/logo.svg', alt: 'Brand', height: 24 }
    stubEditorConfig({ theme: { logo } })
    const result = useEditorTheme()
    expect(result.logo.value).toEqual(logo)
  })

  it('returns undefined logo when not provided', () => {
    stubEditorConfig()
    const { logo } = useEditorTheme()
    expect(logo.value).toBeUndefined()
  })

  it('generates CSS variables for all primary shades', () => {
    stubEditorConfig({ theme: { primaryColor: '#3b82f6' } })
    const { cssVariables } = useEditorTheme()
    const vars = cssVariables.value

    // Should have shades 50-900 + 3 aliases
    expect(vars).toHaveProperty('--color-primary-50')
    expect(vars).toHaveProperty('--color-primary-100')
    expect(vars).toHaveProperty('--color-primary-200')
    expect(vars).toHaveProperty('--color-primary-300')
    expect(vars).toHaveProperty('--color-primary-400')
    expect(vars).toHaveProperty('--color-primary-500')
    expect(vars).toHaveProperty('--color-primary-600')
    expect(vars).toHaveProperty('--color-primary-700')
    expect(vars).toHaveProperty('--color-primary-800')
    expect(vars).toHaveProperty('--color-primary-900')
    expect(vars).toHaveProperty('--color-primary')
    expect(vars).toHaveProperty('--color-primary-dark')
    expect(vars).toHaveProperty('--color-primary-light')
  })

  it('aliases point to correct shades', () => {
    stubEditorConfig({ theme: { primaryColor: '#3b82f6' } })
    const { cssVariables } = useEditorTheme()
    const vars = cssVariables.value

    expect(vars['--color-primary']).toBe(vars['--color-primary-500'])
    expect(vars['--color-primary-dark']).toBe(vars['--color-primary-600'])
    expect(vars['--color-primary-light']).toBe(vars['--color-primary-100'])
  })

  it('generates lighter shades for higher numbers and darker for lower', () => {
    stubEditorConfig({ theme: { primaryColor: '#3b82f6' } })
    const { cssVariables } = useEditorTheme()
    const vars = cssVariables.value

    // shade-50 should be lighter than shade-500
    const hsl50 = hexToHSL(vars['--color-primary-50'])
    const hsl500 = hexToHSL(vars['--color-primary-500'])
    const hsl900 = hexToHSL(vars['--color-primary-900'])

    expect(hsl50.l).toBeGreaterThan(hsl500.l)
    expect(hsl500.l).toBeGreaterThan(hsl900.l)
  })

  it('preserves hue across all generated shades', () => {
    stubEditorConfig({ theme: { primaryColor: '#3b82f6' } })
    const { cssVariables } = useEditorTheme()
    const vars = cssVariables.value

    const baseHue = hexToHSL('#3b82f6').h
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      const { h } = hexToHSL(vars[`--color-primary-${shade}`])
      // Hue should be preserved (allow ±3 for rounding through HSL conversion)
      expect(Math.abs(h - baseHue)).toBeLessThanOrEqual(3)
    }
  })
})
