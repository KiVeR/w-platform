import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Re-stub Nuxt auto-imports (unstubGlobals restores after each test)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

const { useEditorStore } = await import('#editor/stores/editor')

const defaultGlobalStyles = {
  palette: 'turquoise',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  primaryColor: '#14b8a6',
  secondaryColor: '#0d9488',
  fontFamily: 'Inter, system-ui, sans-serif',
  headingFontFamily: 'Inter, system-ui, sans-serif',
  baseFontSize: '16px',
  lineHeight: '1.6',
  contentPadding: '16px',
  widgetGap: '12px',
  borderRadius: '8px',
  pageTitle: '',
  metaDescription: '',
}

describe('useEditorStore', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has default design with version 1.0', () => {
      const store = useEditorStore()
      expect(store.design.version).toBe('1.0')
    })

    it('has default global styles', () => {
      const store = useEditorStore()
      expect(store.design.globalStyles).toEqual(defaultGlobalStyles)
    })

    it('has empty widgets array', () => {
      const store = useEditorStore()
      expect(store.design.widgets).toEqual([])
    })

    it('is not dirty initially', () => {
      const store = useEditorStore()
      expect(store.isDirty).toBe(false)
    })

    it('is not loading initially', () => {
      const store = useEditorStore()
      expect(store.isLoading).toBe(false)
    })

    it('has no lastSavedAt initially', () => {
      const store = useEditorStore()
      expect(store.lastSavedAt).toBeNull()
    })

    it('has no error initially', () => {
      const store = useEditorStore()
      expect(store.error).toBeNull()
    })
  })

  describe('globalStyles getter', () => {
    it('reflects design.globalStyles', () => {
      const store = useEditorStore()
      expect(store.globalStyles).toEqual(defaultGlobalStyles)
    })

    it('updates when design.globalStyles changes', () => {
      const store = useEditorStore()
      store.updateGlobalStyles({ backgroundColor: '#000000' })
      expect(store.globalStyles.backgroundColor).toBe('#000000')
    })
  })

  describe('hasUnsavedChanges getter', () => {
    it('mirrors isDirty when false', () => {
      const store = useEditorStore()
      expect(store.hasUnsavedChanges).toBe(false)
    })

    it('mirrors isDirty when true', () => {
      const store = useEditorStore()
      store.markAsDirty()
      expect(store.hasUnsavedChanges).toBe(true)
    })
  })

  describe('setDesign', () => {
    it('updates the design', () => {
      const store = useEditorStore()
      const newDesign = {
        version: '2.0',
        globalStyles: { ...defaultGlobalStyles, backgroundColor: '#ff0000' },
        widgets: [{ id: '1', type: 'text', content: {}, styles: {} }],
      }
      store.setDesign(newDesign as any)
      expect(store.design.version).toBe('2.0')
      expect(store.design.globalStyles.backgroundColor).toBe('#ff0000')
      expect(store.design.widgets).toHaveLength(1)
    })

    it('resets isDirty to false', () => {
      const store = useEditorStore()
      store.markAsDirty()
      expect(store.isDirty).toBe(true)
      store.setDesign({ version: '1.0', globalStyles: defaultGlobalStyles, widgets: [] } as any)
      expect(store.isDirty).toBe(false)
    })
  })

  describe('updateGlobalStyles', () => {
    it('merges partial styles into existing globalStyles', () => {
      const store = useEditorStore()
      store.updateGlobalStyles({ primaryColor: '#ff6600', baseFontSize: '18px' })
      expect(store.design.globalStyles.primaryColor).toBe('#ff6600')
      expect(store.design.globalStyles.baseFontSize).toBe('18px')
      // Other styles remain untouched
      expect(store.design.globalStyles.backgroundColor).toBe('#ffffff')
    })

    it('marks the store as dirty', () => {
      const store = useEditorStore()
      expect(store.isDirty).toBe(false)
      store.updateGlobalStyles({ backgroundColor: '#111111' })
      expect(store.isDirty).toBe(true)
    })
  })

  describe('markAsDirty / markAsSaved', () => {
    it('markAsDirty sets isDirty to true', () => {
      const store = useEditorStore()
      store.markAsDirty()
      expect(store.isDirty).toBe(true)
    })

    it('markAsSaved sets isDirty to false', () => {
      const store = useEditorStore()
      store.markAsDirty()
      store.markAsSaved()
      expect(store.isDirty).toBe(false)
    })

    it('markAsSaved updates lastSavedAt to a Date', () => {
      const store = useEditorStore()
      const before = new Date()
      store.markAsSaved()
      const after = new Date()
      expect(store.lastSavedAt).toBeInstanceOf(Date)
      expect(store.lastSavedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(store.lastSavedAt!.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('setLoading', () => {
    it('sets isLoading to true', () => {
      const store = useEditorStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useEditorStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets error message', () => {
      const store = useEditorStore()
      store.setError('Something went wrong')
      expect(store.error).toBe('Something went wrong')
    })

    it('clears error with null', () => {
      const store = useEditorStore()
      store.setError('error')
      store.setError(null)
      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('restores design to default', () => {
      const store = useEditorStore()
      store.updateGlobalStyles({ backgroundColor: '#000' })
      store.reset()
      expect(store.design.globalStyles).toEqual(defaultGlobalStyles)
      expect(store.design.widgets).toEqual([])
      expect(store.design.version).toBe('1.0')
    })

    it('resets isDirty to false', () => {
      const store = useEditorStore()
      store.markAsDirty()
      store.reset()
      expect(store.isDirty).toBe(false)
    })

    it('resets error to null', () => {
      const store = useEditorStore()
      store.setError('fail')
      store.reset()
      expect(store.error).toBeNull()
    })
  })
})
