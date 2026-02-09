import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref } from 'vue'

// Create reactive mock globalStyles that persists across tests
const mockGlobalStyles = reactive<Record<string, any>>({})

function stubGlobals() {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useEditorStore', () => ({
    globalStyles: mockGlobalStyles,
  }))
}

// Stub before dynamic import so module evaluation picks them up
stubGlobals()

const { useGlobalStyles } = await import('#editor/composables/useGlobalStyles')

describe('useGlobalStyles', () => {
  beforeEach(() => {
    // Re-stub because restoreMocks: true resets globals after each test
    stubGlobals()
    // Clear all custom properties between tests
    for (const key of Object.keys(mockGlobalStyles)) {
      delete mockGlobalStyles[key]
    }
  })

  describe('typography fallbacks', () => {
    it('returns default fontFamily when globalStyles is empty', () => {
      const { fontFamily } = useGlobalStyles()
      expect(fontFamily.value).toBe('Inter, system-ui, sans-serif')
    })

    it('returns default headingFontFamily (inherits fontFamily) when globalStyles is empty', () => {
      const { headingFontFamily } = useGlobalStyles()
      expect(headingFontFamily.value).toBe('Inter, system-ui, sans-serif')
    })

    it('returns default baseFontSize when globalStyles is empty', () => {
      const { baseFontSize } = useGlobalStyles()
      expect(baseFontSize.value).toBe('16px')
    })

    it('returns default lineHeight when globalStyles is empty', () => {
      const { lineHeight } = useGlobalStyles()
      expect(lineHeight.value).toBe('1.6')
    })
  })

  describe('brand color fallbacks', () => {
    it('returns default primaryColor when globalStyles is empty', () => {
      const { primaryColor } = useGlobalStyles()
      expect(primaryColor.value).toBe('#14b8a6')
    })

    it('returns default secondaryColor when globalStyles is empty', () => {
      const { secondaryColor } = useGlobalStyles()
      expect(secondaryColor.value).toBe('#0d9488')
    })

    it('returns default backgroundColor when globalStyles is empty', () => {
      const { backgroundColor } = useGlobalStyles()
      expect(backgroundColor.value).toBe('#ffffff')
    })

    it('returns default textColor when globalStyles is empty', () => {
      const { textColor } = useGlobalStyles()
      expect(textColor.value).toBe('#1e293b')
    })
  })

  describe('layout fallbacks', () => {
    it('returns default contentPadding when globalStyles is empty', () => {
      const { contentPadding } = useGlobalStyles()
      expect(contentPadding.value).toBe('16px')
    })

    it('returns default widgetGap when globalStyles is empty', () => {
      const { widgetGap } = useGlobalStyles()
      expect(widgetGap.value).toBe('12px')
    })

    it('returns default borderRadius when globalStyles is empty', () => {
      const { borderRadius } = useGlobalStyles()
      expect(borderRadius.value).toBe('8px')
    })
  })

  describe('custom values from globalStyles', () => {
    it('returns custom fontFamily when set', () => {
      mockGlobalStyles.fontFamily = 'Roboto, sans-serif'
      const { fontFamily } = useGlobalStyles()
      expect(fontFamily.value).toBe('Roboto, sans-serif')
    })

    it('returns custom primaryColor when set', () => {
      mockGlobalStyles.primaryColor = '#ff0000'
      const { primaryColor } = useGlobalStyles()
      expect(primaryColor.value).toBe('#ff0000')
    })

    it('returns custom contentPadding when set', () => {
      mockGlobalStyles.contentPadding = '24px'
      const { contentPadding } = useGlobalStyles()
      expect(contentPadding.value).toBe('24px')
    })
  })

  describe('headingFontFamily inheritance', () => {
    it('inherits from fontFamily when headingFontFamily is not defined', () => {
      mockGlobalStyles.fontFamily = 'Poppins, sans-serif'
      const { headingFontFamily } = useGlobalStyles()
      expect(headingFontFamily.value).toBe('Poppins, sans-serif')
    })

    it('uses its own value when explicitly set, ignoring fontFamily', () => {
      mockGlobalStyles.fontFamily = 'Poppins, sans-serif'
      mockGlobalStyles.headingFontFamily = 'Playfair Display, serif'
      const { headingFontFamily } = useGlobalStyles()
      expect(headingFontFamily.value).toBe('Playfair Display, serif')
    })
  })

  describe('getEffectiveStyle', () => {
    it('returns widget value when it is defined and non-empty', () => {
      const { getEffectiveStyle } = useGlobalStyles()
      const result = getEffectiveStyle('#ff0000', '#14b8a6', '#000000')
      expect(result).toBe('#ff0000')
    })

    it('returns global value when widget value is undefined', () => {
      const { getEffectiveStyle } = useGlobalStyles()
      const result = getEffectiveStyle(undefined, '#14b8a6', '#000000')
      expect(result).toBe('#14b8a6')
    })

    it('returns global value when widget value is null', () => {
      const { getEffectiveStyle } = useGlobalStyles()
      const result = getEffectiveStyle(null, '#14b8a6', '#000000')
      expect(result).toBe('#14b8a6')
    })

    it('returns global value when widget value is empty string', () => {
      const { getEffectiveStyle } = useGlobalStyles()
      const result = getEffectiveStyle('', '#14b8a6', '#000000')
      expect(result).toBe('#14b8a6')
    })

    it('returns fallback when both widget and global values are nullish', () => {
      const { getEffectiveStyle } = useGlobalStyles()
      const result = getEffectiveStyle(undefined, null as any, '#000000')
      expect(result).toBe('#000000')
    })
  })

  describe('isUsingGlobalColor', () => {
    it('returns true when widget value is undefined', () => {
      const { isUsingGlobalColor } = useGlobalStyles()
      expect(isUsingGlobalColor(undefined)).toBe(true)
    })

    it('returns true when widget value is empty string', () => {
      const { isUsingGlobalColor } = useGlobalStyles()
      expect(isUsingGlobalColor('')).toBe(true)
    })

    it('returns false when widget value is a non-empty string', () => {
      const { isUsingGlobalColor } = useGlobalStyles()
      expect(isUsingGlobalColor('#ff0000')).toBe(false)
    })
  })

  describe('reactivity', () => {
    it('updates computed values when globalStyles changes', () => {
      const { primaryColor, fontFamily } = useGlobalStyles()

      expect(primaryColor.value).toBe('#14b8a6')
      expect(fontFamily.value).toBe('Inter, system-ui, sans-serif')

      mockGlobalStyles.primaryColor = '#e11d48'
      mockGlobalStyles.fontFamily = 'Montserrat, sans-serif'

      expect(primaryColor.value).toBe('#e11d48')
      expect(fontFamily.value).toBe('Montserrat, sans-serif')
    })
  })
})
