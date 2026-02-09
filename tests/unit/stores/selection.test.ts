import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Re-stub Vue auto-imports (unstubGlobals clears setup.ts stubs)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

// Mock uuid module (widgets store dependency)
vi.mock('uuid', () => ({
  v4: () => `uuid-${Math.random().toString(36).slice(2)}`,
}))

// Stub auto-imported dependencies for widgets store
function getWidgetConfigStub(type: string) {
  return {
    type,
    label: type,
    icon: 'icon',
    category: 'content',
    defaultContent: { text: 'default' },
    defaultStyles: { margin: '8px' },
    canHaveChildren: ['row', 'column', 'form'].includes(type),
  }
}
vi.stubGlobal('getWidgetConfig', getWidgetConfigStub)

// Stub useEditorStore (dependency of widgets store)
const mockEditorStore = {
  isDirty: false,
  markAsDirty: vi.fn(),
}
vi.stubGlobal('useEditorStore', () => mockEditorStore)

const { useWidgetsStore } = await import('#editor/stores/widgets')

// Stub useWidgetsStore globally so selection store can find it
vi.stubGlobal('useWidgetsStore', useWidgetsStore)

const { useSelectionStore } = await import('#editor/stores/selection')

function makeWidget(id: string, order: number) {
  return {
    id,
    type: 'text' as const,
    order,
    content: { text: 'hello' },
    styles: { margin: '8px' },
  }
}

describe('useSelectionStore', () => {
  let selectionStore: ReturnType<typeof useSelectionStore>
  let widgetsStore: ReturnType<typeof useWidgetsStore>

  beforeEach(() => {
    // Re-stub globals cleared by unstubGlobals
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    vi.stubGlobal('getWidgetConfig', getWidgetConfigStub)
    vi.stubGlobal('useEditorStore', () => mockEditorStore)
    vi.stubGlobal('useWidgetsStore', useWidgetsStore)

    setActivePinia(createPinia())
    widgetsStore = useWidgetsStore()
    selectionStore = useSelectionStore()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has no selection by default', () => {
      expect(selectionStore.selectedId).toBeNull()
      expect(selectionStore.hasSelection).toBe(false)
    })

    it('has no hovered widget by default', () => {
      expect(selectionStore.hoveredId).toBeNull()
    })

    it('selectedWidget is null when nothing is selected', () => {
      expect(selectionStore.selectedWidget).toBeNull()
    })
  })

  describe('select and deselect', () => {
    it('select sets the selected id', () => {
      selectionStore.select('widget-1')
      expect(selectionStore.selectedId).toBe('widget-1')
      expect(selectionStore.hasSelection).toBe(true)
    })

    it('deselect clears the selection', () => {
      selectionStore.select('widget-1')
      selectionStore.deselect()
      expect(selectionStore.selectedId).toBeNull()
      expect(selectionStore.hasSelection).toBe(false)
    })

    it('select with null clears the selection', () => {
      selectionStore.select('widget-1')
      selectionStore.select(null)
      expect(selectionStore.selectedId).toBeNull()
    })
  })

  describe('selectedWidget', () => {
    it('returns the widget from widgets store when selected', () => {
      const widgets = [makeWidget('w1', 0), makeWidget('w2', 1)]
      widgetsStore.setWidgets(widgets)
      selectionStore.select('w1')
      expect(selectionStore.selectedWidget).toBeDefined()
      expect(selectionStore.selectedWidget!.id).toBe('w1')
    })

    it('returns undefined when selected id does not match any widget', () => {
      widgetsStore.setWidgets([makeWidget('w1', 0)])
      selectionStore.select('nonexistent')
      expect(selectionStore.selectedWidget).toBeUndefined()
    })
  })

  describe('setHovered', () => {
    it('sets the hovered widget id', () => {
      selectionStore.setHovered('widget-1')
      expect(selectionStore.hoveredId).toBe('widget-1')
    })

    it('clears the hovered id with null', () => {
      selectionStore.setHovered('widget-1')
      selectionStore.setHovered(null)
      expect(selectionStore.hoveredId).toBeNull()
    })
  })

  describe('selectNext', () => {
    it('does nothing on empty list', () => {
      selectionStore.selectNext()
      expect(selectionStore.selectedId).toBeNull()
    })

    it('selects first widget when nothing is selected', () => {
      widgetsStore.setWidgets([makeWidget('w1', 0), makeWidget('w2', 1)])
      selectionStore.selectNext()
      expect(selectionStore.selectedId).toBe('w1')
    })

    it('moves to next widget', () => {
      widgetsStore.setWidgets([makeWidget('w1', 0), makeWidget('w2', 1), makeWidget('w3', 2)])
      selectionStore.select('w1')
      selectionStore.selectNext()
      expect(selectionStore.selectedId).toBe('w2')
    })

    it('wraps around to first widget (circular)', () => {
      widgetsStore.setWidgets([makeWidget('w1', 0), makeWidget('w2', 1)])
      selectionStore.select('w2')
      selectionStore.selectNext()
      expect(selectionStore.selectedId).toBe('w1')
    })
  })

  describe('selectPrevious', () => {
    it('does nothing on empty list', () => {
      selectionStore.selectPrevious()
      expect(selectionStore.selectedId).toBeNull()
    })

    it('selects last widget when nothing is selected', () => {
      widgetsStore.setWidgets([makeWidget('w1', 0), makeWidget('w2', 1)])
      selectionStore.selectPrevious()
      expect(selectionStore.selectedId).toBe('w2')
    })

    it('moves to previous widget', () => {
      widgetsStore.setWidgets([makeWidget('w1', 0), makeWidget('w2', 1), makeWidget('w3', 2)])
      selectionStore.select('w2')
      selectionStore.selectPrevious()
      expect(selectionStore.selectedId).toBe('w1')
    })

    it('wraps around to last widget (circular)', () => {
      widgetsStore.setWidgets([makeWidget('w1', 0), makeWidget('w2', 1)])
      selectionStore.select('w1')
      selectionStore.selectPrevious()
      expect(selectionStore.selectedId).toBe('w2')
    })
  })
})
