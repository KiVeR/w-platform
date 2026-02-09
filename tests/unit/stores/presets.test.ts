import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Re-stub Nuxt auto-imports (setup.ts stubs may be restored between tests)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const mockTemplatePresets = [
  {
    id: 'tpl-1',
    name: 'Template 1',
    category: 'marketing',
    tags: ['tag1'],
    thumbnail: '',
    description: '',
    globalStyles: { palette: 'blue', backgroundColor: '#fff', textColor: '#000' },
    widgets: [
      { id: 'w1', type: 'title', order: 0, content: { text: 'Hello' }, styles: { margin: '8px' } },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Template 2',
    category: 'event',
    tags: ['tag2'],
    thumbnail: '',
    description: '',
    globalStyles: { palette: 'red', backgroundColor: '#000', textColor: '#fff' },
    widgets: [],
  },
]

const mockSectionPresets = [
  {
    id: 'sec-1',
    name: 'Section 1',
    category: 'hero',
    tags: ['hero'],
    thumbnail: '',
    description: '',
    widgets: [
      { id: 'sw1', type: 'text', order: 0, content: { text: 'Sect' }, styles: {} },
    ],
  },
  {
    id: 'sec-2',
    name: 'Section 2',
    category: 'cta',
    tags: ['cta'],
    thumbnail: '',
    description: '',
    widgets: [],
  },
]

const mockTemplateCategories = [{ id: 'marketing', label: 'Marketing', icon: 'Megaphone' }]
const mockSectionCategories = [{ id: 'hero', label: 'Hero', icon: 'Image' }]

// ---------------------------------------------------------------------------
// Mock config/presets module
// ---------------------------------------------------------------------------
vi.mock('#editor/config/presets', () => ({
  templatePresets: mockTemplatePresets,
  sectionPresets: mockSectionPresets,
  templateCategories: mockTemplateCategories,
  sectionCategories: mockSectionCategories,
  searchTemplates: vi.fn((q: string) =>
    mockTemplatePresets.filter(t => t.name.toLowerCase().includes(q.toLowerCase())),
  ),
  searchSections: vi.fn((q: string) =>
    mockSectionPresets.filter(s => s.name.toLowerCase().includes(q.toLowerCase())),
  ),
  getTemplateById: vi.fn((id: string) =>
    mockTemplatePresets.find(t => t.id === id),
  ),
  getSectionById: vi.fn((id: string) =>
    mockSectionPresets.find(s => s.id === id),
  ),
  getTemplatesByCategory: vi.fn((cat: string) =>
    mockTemplatePresets.filter(t => t.category === cat),
  ),
  getSectionsByCategory: vi.fn((cat: string) =>
    mockSectionPresets.filter(s => s.category === cat),
  ),
}))

// ---------------------------------------------------------------------------
// Mock dependent stores
// ---------------------------------------------------------------------------
const mockEditorStore = {
  updateGlobalStyles: vi.fn(),
  markAsDirty: vi.fn(),
}

const mockWidgetsStore = {
  items: [] as any[],
  deepCloneWidget: vi.fn((w: any) => ({
    ...w,
    id: `clone-${w.id}`,
    content: { ...w.content },
    styles: { ...w.styles },
  })),
  setWidgets: vi.fn(),
  reorderWidgets: vi.fn(),
}

vi.stubGlobal('useEditorStore', () => mockEditorStore)
vi.stubGlobal('useWidgetsStore', () => mockWidgetsStore)

// ---------------------------------------------------------------------------
// Import the store under test (must happen after all mocks)
// ---------------------------------------------------------------------------
const { usePresetsStore } = await import('#editor/stores/presets')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('usePresetsStore', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())

    // Reset mock store state
    mockEditorStore.updateGlobalStyles.mockClear()
    mockEditorStore.markAsDirty.mockClear()
    mockWidgetsStore.items = []
    mockWidgetsStore.deepCloneWidget.mockClear()
    mockWidgetsStore.deepCloneWidget.mockImplementation((w: any) => ({
      ...w,
      id: `clone-${w.id}`,
      content: { ...w.content },
      styles: { ...w.styles },
    }))
    mockWidgetsStore.setWidgets.mockClear()
    mockWidgetsStore.reorderWidgets.mockClear()
  })

  // -------------------------------------------------------------------------
  // Initial State
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('has selectedTemplate as null', () => {
      const store = usePresetsStore()
      expect(store.selectedTemplate).toBeNull()
    })

    it('has isApplyModalOpen as false', () => {
      const store = usePresetsStore()
      expect(store.isApplyModalOpen).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Getters
  // -------------------------------------------------------------------------
  describe('getters', () => {
    it('templates returns templatePresets', () => {
      const store = usePresetsStore()
      expect(store.templates).toBe(mockTemplatePresets)
    })

    it('sections returns sectionPresets', () => {
      const store = usePresetsStore()
      expect(store.sections).toBe(mockSectionPresets)
    })

    it('templateCategoryList returns templateCategories', () => {
      const store = usePresetsStore()
      expect(store.templateCategoryList).toBe(mockTemplateCategories)
    })

    it('sectionCategoryList returns sectionCategories', () => {
      const store = usePresetsStore()
      expect(store.sectionCategoryList).toBe(mockSectionCategories)
    })
  })

  // -------------------------------------------------------------------------
  // Modal Actions
  // -------------------------------------------------------------------------
  describe('openApplyModal', () => {
    it('sets selectedTemplate to the given template', () => {
      const store = usePresetsStore()
      store.openApplyModal(mockTemplatePresets[0] as any)
      expect(store.selectedTemplate).toEqual(mockTemplatePresets[0])
    })

    it('sets isApplyModalOpen to true', () => {
      const store = usePresetsStore()
      store.openApplyModal(mockTemplatePresets[0] as any)
      expect(store.isApplyModalOpen).toBe(true)
    })
  })

  describe('closeApplyModal', () => {
    it('clears selectedTemplate to null', () => {
      const store = usePresetsStore()
      store.openApplyModal(mockTemplatePresets[0] as any)
      store.closeApplyModal()
      expect(store.selectedTemplate).toBeNull()
    })

    it('sets isApplyModalOpen to false', () => {
      const store = usePresetsStore()
      store.openApplyModal(mockTemplatePresets[0] as any)
      store.closeApplyModal()
      expect(store.isApplyModalOpen).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Apply Template
  // -------------------------------------------------------------------------
  describe('applyTemplate', () => {
    const template = mockTemplatePresets[0] as any

    it('calls updateGlobalStyles with template globalStyles', () => {
      const store = usePresetsStore()
      store.applyTemplate(template)
      expect(mockEditorStore.updateGlobalStyles).toHaveBeenCalledWith(template.globalStyles)
    })

    it('clones each widget via deepCloneWidget', () => {
      const store = usePresetsStore()
      store.applyTemplate(template)
      expect(mockWidgetsStore.deepCloneWidget).toHaveBeenCalledTimes(template.widgets.length)
      expect(mockWidgetsStore.deepCloneWidget).toHaveBeenCalledWith(template.widgets[0])
    })

    it('sets order on cloned widgets starting from 0', () => {
      const store = usePresetsStore()
      store.applyTemplate(template)
      const passedWidgets = mockWidgetsStore.setWidgets.mock.calls[0][0]
      passedWidgets.forEach((w: any, i: number) => {
        expect(w.order).toBe(i)
      })
    })

    it('calls setWidgets with the cloned widgets', () => {
      const store = usePresetsStore()
      store.applyTemplate(template)
      expect(mockWidgetsStore.setWidgets).toHaveBeenCalledTimes(1)
      const passedWidgets = mockWidgetsStore.setWidgets.mock.calls[0][0]
      expect(passedWidgets).toHaveLength(template.widgets.length)
      expect(passedWidgets[0].id).toBe(`clone-${template.widgets[0].id}`)
    })

    it('calls markAsDirty', () => {
      const store = usePresetsStore()
      store.applyTemplate(template)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalledTimes(1)
    })

    it('closes the modal after applying', () => {
      const store = usePresetsStore()
      store.openApplyModal(template)
      store.applyTemplate(template)
      expect(store.selectedTemplate).toBeNull()
      expect(store.isApplyModalOpen).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Add Section
  // -------------------------------------------------------------------------
  describe('addSection', () => {
    const section = mockSectionPresets[0] as any

    it('appends widgets to the end when no insertIndex is given', () => {
      const store = usePresetsStore()
      mockWidgetsStore.items = [{ id: 'existing', type: 'text', order: 0 }]
      store.addSection(section)
      // Should push cloned widget (items had 1 item, now should have 2)
      expect(mockWidgetsStore.items).toHaveLength(2)
      expect(mockWidgetsStore.items[1].id).toBe(`clone-${section.widgets[0].id}`)
    })

    it('sets order based on current item count when appending', () => {
      const store = usePresetsStore()
      mockWidgetsStore.items = [{ id: 'existing', type: 'text', order: 0 }]
      store.addSection(section)
      // currentCount was 1, so cloned widget order should be 1
      expect(mockWidgetsStore.items[1].order).toBe(1)
    })

    it('inserts widgets at the specified index when insertIndex is given', () => {
      const store = usePresetsStore()
      mockWidgetsStore.items = [
        { id: 'a', type: 'text', order: 0 },
        { id: 'b', type: 'text', order: 1 },
      ]
      store.addSection(section, 1)
      // Should have spliced the cloned widget at index 1
      expect(mockWidgetsStore.items).toHaveLength(3)
      expect(mockWidgetsStore.items[1].id).toBe(`clone-${section.widgets[0].id}`)
    })

    it('sets order to insertIndex when inserting at a position', () => {
      const store = usePresetsStore()
      mockWidgetsStore.items = [
        { id: 'a', type: 'text', order: 0 },
        { id: 'b', type: 'text', order: 1 },
      ]
      store.addSection(section, 1)
      expect(mockWidgetsStore.items[1].order).toBe(1)
    })

    it('calls reorderWidgets after insertion', () => {
      const store = usePresetsStore()
      store.addSection(section)
      expect(mockWidgetsStore.reorderWidgets).toHaveBeenCalledTimes(1)
    })

    it('calls markAsDirty after insertion', () => {
      const store = usePresetsStore()
      store.addSection(section)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  // Filter Templates
  // -------------------------------------------------------------------------
  describe('filterTemplates', () => {
    it('returns all templates when query is empty', () => {
      const store = usePresetsStore()
      const results = store.filterTemplates('')
      expect(results).toBe(mockTemplatePresets)
    })

    it('calls searchTemplates when query is provided', async () => {
      const { searchTemplates } = await import('#editor/config/presets')
      const store = usePresetsStore()
      const results = store.filterTemplates('Template 1')
      expect(searchTemplates).toHaveBeenCalledWith('Template 1')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('tpl-1')
    })

    it('filters by category when category is provided', () => {
      const store = usePresetsStore()
      const results = store.filterTemplates('', 'marketing')
      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('marketing')
    })

    it('filters by both query and category', () => {
      const store = usePresetsStore()
      const results = store.filterTemplates('Template', 'event')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('tpl-2')
    })

    it('returns empty when no match for category', () => {
      const store = usePresetsStore()
      const results = store.filterTemplates('', 'nonexistent')
      expect(results).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  // Filter Sections
  // -------------------------------------------------------------------------
  describe('filterSections', () => {
    it('returns all sections when query is empty', () => {
      const store = usePresetsStore()
      const results = store.filterSections('')
      expect(results).toBe(mockSectionPresets)
    })

    it('calls searchSections when query is provided', async () => {
      const { searchSections } = await import('#editor/config/presets')
      const store = usePresetsStore()
      const results = store.filterSections('Section 1')
      expect(searchSections).toHaveBeenCalledWith('Section 1')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('sec-1')
    })

    it('filters by category when category is provided', () => {
      const store = usePresetsStore()
      const results = store.filterSections('', 'hero')
      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('hero')
    })

    it('filters by both query and category', () => {
      const store = usePresetsStore()
      const results = store.filterSections('Section', 'cta')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('sec-2')
    })
  })

  // -------------------------------------------------------------------------
  // Getters by ID / Category
  // -------------------------------------------------------------------------
  describe('getTemplateById', () => {
    it('delegates to config getTemplateById', () => {
      const store = usePresetsStore()
      const result = store.getTemplateById('tpl-1')
      expect(result).toEqual(mockTemplatePresets[0])
    })

    it('returns undefined for unknown id', () => {
      const store = usePresetsStore()
      const result = store.getTemplateById('unknown')
      expect(result).toBeUndefined()
    })
  })

  describe('getSectionById', () => {
    it('delegates to config getSectionById', () => {
      const store = usePresetsStore()
      const result = store.getSectionById('sec-1')
      expect(result).toEqual(mockSectionPresets[0])
    })

    it('returns undefined for unknown id', () => {
      const store = usePresetsStore()
      const result = store.getSectionById('unknown')
      expect(result).toBeUndefined()
    })
  })

  describe('getTemplatesForCategory', () => {
    it('delegates to config getTemplatesByCategory', () => {
      const store = usePresetsStore()
      const results = store.getTemplatesForCategory('marketing')
      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('marketing')
    })

    it('returns empty array for unknown category', () => {
      const store = usePresetsStore()
      const results = store.getTemplatesForCategory('nonexistent')
      expect(results).toHaveLength(0)
    })
  })

  describe('getSectionsForCategory', () => {
    it('delegates to config getSectionsByCategory', () => {
      const store = usePresetsStore()
      const results = store.getSectionsForCategory('hero')
      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('hero')
    })

    it('returns empty array for unknown category', () => {
      const store = usePresetsStore()
      const results = store.getSectionsForCategory('nonexistent')
      expect(results).toHaveLength(0)
    })
  })
})
