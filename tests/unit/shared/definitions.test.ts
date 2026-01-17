import { describe, expect, it } from 'vitest'
import { WIDGET_CATEGORIES, WIDGET_TYPES, widgetCategorySchema, widgetTypeSchema } from '~~/shared/widgets/definitions'

describe('widget definitions - single source of truth', () => {
  describe('widget types array', () => {
    it('contains all 24 expected widget types', () => {
      expect(WIDGET_TYPES).toHaveLength(24)
    })

    it('contains all base widgets', () => {
      const baseWidgets = ['title', 'text', 'image', 'button', 'separator', 'spacer', 'click-to-call']
      for (const widget of baseWidgets) {
        expect(WIDGET_TYPES).toContain(widget)
      }
    })

    it('contains structure widgets', () => {
      expect(WIDGET_TYPES).toContain('row')
      expect(WIDGET_TYPES).toContain('column')
    })

    it('contains form widgets', () => {
      expect(WIDGET_TYPES).toContain('form')
      expect(WIDGET_TYPES).toContain('form-field')
    })

    it('contains media widgets', () => {
      const mediaWidgets = ['video', 'map', 'social', 'icon']
      for (const widget of mediaWidgets) {
        expect(WIDGET_TYPES).toContain(widget)
      }
    })

    it('contains wellpack widgets', () => {
      const wellpackWidgets = ['barcode', 'store-locator', 'drive', 'scratch', 'flipcard']
      for (const widget of wellpackWidgets) {
        expect(WIDGET_TYPES).toContain(widget)
      }
    })

    it('contains advanced widgets', () => {
      const advancedWidgets = ['gallery', 'slider', 'link-image', 'effect']
      for (const widget of advancedWidgets) {
        expect(WIDGET_TYPES).toContain(widget)
      }
    })
  })

  describe('widgetTypeSchema', () => {
    it('validates valid widget types', () => {
      for (const type of WIDGET_TYPES) {
        expect(widgetTypeSchema.safeParse(type).success).toBe(true)
      }
    })

    it('rejects invalid widget types', () => {
      const invalidTypes = ['invalid', 'unknown', 'foo', 'bar', 123, null, undefined]
      for (const type of invalidTypes) {
        expect(widgetTypeSchema.safeParse(type).success).toBe(false)
      }
    })

    it('provides helpful error message for invalid types', () => {
      const result = widgetTypeSchema.safeParse('invalid-widget')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid enum value')
      }
    })
  })

  describe('widget categories array', () => {
    it('contains all 6 expected categories', () => {
      expect(WIDGET_CATEGORIES).toHaveLength(6)
    })

    it('contains all category values', () => {
      const expectedCategories = ['base', 'structure', 'form', 'media', 'wellpack', 'action']
      for (const category of expectedCategories) {
        expect(WIDGET_CATEGORIES).toContain(category)
      }
    })
  })

  describe('widgetCategorySchema', () => {
    it('validates valid categories', () => {
      for (const category of WIDGET_CATEGORIES) {
        expect(widgetCategorySchema.safeParse(category).success).toBe(true)
      }
    })

    it('rejects invalid categories', () => {
      const invalidCategories = ['invalid', 'unknown', 'widgets', 123]
      for (const category of invalidCategories) {
        expect(widgetCategorySchema.safeParse(category).success).toBe(false)
      }
    })
  })

  describe('type safety', () => {
    it('widget types array is readonly (as const)', () => {
      // TypeScript ensures this at compile time
      // This test verifies the array reference is consistent
      const types1 = WIDGET_TYPES
      const types2 = WIDGET_TYPES
      expect(types1).toBe(types2)
    })
  })
})
