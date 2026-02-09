import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Re-stub Vue auto-imports (unstubGlobals clears setup.ts stubs)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

// Mock uuid module
vi.mock('uuid', () => {
  let counter = 0
  return {
    v4: () => `uuid-${++counter}`,
  }
})

// Stub getWidgetConfig (auto-imported in layer)
function getWidgetConfigStub(type: string) {
  if (type === 'unknown-type') {
    return undefined
  }
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

describe('useWidgetsStore', () => {
  let store: ReturnType<typeof useWidgetsStore>

  beforeEach(() => {
    // Re-stub globals cleared by unstubGlobals
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    vi.stubGlobal('getWidgetConfig', getWidgetConfigStub)
    vi.stubGlobal('useEditorStore', () => mockEditorStore)

    setActivePinia(createPinia())
    store = useWidgetsStore()
    vi.clearAllMocks()
  })

  describe('createWidget', () => {
    it('creates a widget with unique id and correct defaults', () => {
      const widget = store.createWidget('title')
      expect(widget.id).toMatch(/^uuid-\d+$/)
      expect(widget.type).toBe('title')
      expect(widget.content).toEqual({ text: 'default' })
      expect(widget.styles).toEqual({ margin: '8px' })
    })

    it('throws for unknown widget type', () => {
      expect(() => store.createWidget('unknown-type' as any)).toThrowError('Unknown widget type: unknown-type')
    })

    it('creates container widget with empty children array', () => {
      const widget = store.createWidget('row')
      expect(widget.children).toEqual([])
    })

    it('creates non-container widget without children property', () => {
      const widget = store.createWidget('text')
      expect(widget.children).toBeUndefined()
    })

    it('generates unique ids for each widget', () => {
      const w1 = store.createWidget('text')
      const w2 = store.createWidget('text')
      expect(w1.id).not.toBe(w2.id)
    })
  })

  describe('addWidget', () => {
    it('adds a widget to items and marks dirty', () => {
      store.addWidget('title')
      expect(store.items.length).toBe(1)
      expect(store.items[0].type).toBe('title')
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })

    it('adds widget at specific index', () => {
      store.addWidget('title')
      store.addWidget('text')
      store.addWidget('button', 1)
      expect(store.items[1].type).toBe('button')
      expect(store.items.length).toBe(3)
    })

    it('reorders widgets after index insertion', () => {
      store.addWidget('title')
      store.addWidget('text')
      store.addWidget('button', 0)
      expect(store.items[0].order).toBe(0)
      expect(store.items[1].order).toBe(1)
      expect(store.items[2].order).toBe(2)
    })

    it('creates 2 column children for row widget', () => {
      const widget = store.addWidget('row')
      expect(widget.children).toHaveLength(2)
      expect(widget.children![0].type).toBe('column')
      expect(widget.children![1].type).toBe('column')
    })

    it('returns the created widget', () => {
      const widget = store.addWidget('text')
      expect(widget).toBeDefined()
      expect(widget.type).toBe('text')
    })
  })

  describe('removeWidget', () => {
    it('removes widget by id and marks dirty', () => {
      const widget = store.addWidget('title')
      vi.clearAllMocks()
      store.removeWidget(widget.id)
      expect(store.items.length).toBe(0)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })

    it('reorders remaining widgets after removal', () => {
      const w1 = store.addWidget('title')
      store.addWidget('text')
      store.addWidget('button')
      store.removeWidget(w1.id)
      expect(store.items[0].order).toBe(0)
      expect(store.items[1].order).toBe(1)
    })

    it('does nothing for non-existent id', () => {
      store.addWidget('title')
      vi.clearAllMocks()
      store.removeWidget('nonexistent')
      expect(store.items.length).toBe(1)
      expect(mockEditorStore.markAsDirty).not.toHaveBeenCalled()
    })
  })

  describe('updateWidget', () => {
    it('merges content partially', () => {
      const widget = store.addWidget('title')
      store.updateWidget(widget.id, { content: { text: 'updated' } })
      expect(store.findWidgetById(widget.id)!.content.text).toBe('updated')
    })

    it('merges styles partially', () => {
      const widget = store.addWidget('title')
      store.updateWidget(widget.id, { styles: { color: 'red' } })
      const found = store.findWidgetById(widget.id)!
      expect(found.styles.color).toBe('red')
      expect(found.styles.margin).toBe('8px')
    })

    it('marks dirty on update', () => {
      const widget = store.addWidget('text')
      vi.clearAllMocks()
      store.updateWidget(widget.id, { content: { text: 'new' } })
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })
  })

  describe('updateWidgetContent', () => {
    it('delegates to updateWidget for content', () => {
      const widget = store.addWidget('title')
      store.updateWidgetContent(widget.id, { text: 'via content' })
      expect(store.findWidgetById(widget.id)!.content.text).toBe('via content')
    })
  })

  describe('updateWidgetStyles', () => {
    it('delegates to updateWidget for styles', () => {
      const widget = store.addWidget('title')
      store.updateWidgetStyles(widget.id, { color: 'blue' })
      expect(store.findWidgetById(widget.id)!.styles.color).toBe('blue')
    })
  })

  describe('addChildWidget', () => {
    it('adds a child to a parent widget', () => {
      const parent = store.addWidget('column')
      const child = store.addChildWidget(parent.id, 'text')
      expect(child).not.toBeNull()
      expect(child!.type).toBe('text')
      const found = store.findWidgetById(parent.id)!
      expect(found.children).toHaveLength(1)
      expect(found.children![0].id).toBe(child!.id)
    })

    it('returns null for non-existent parent', () => {
      const result = store.addChildWidget('nonexistent', 'text')
      expect(result).toBeNull()
    })

    it('marks dirty when adding child', () => {
      const parent = store.addWidget('column')
      vi.clearAllMocks()
      store.addChildWidget(parent.id, 'text')
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })
  })

  describe('removeChildWidget', () => {
    it('removes a child from a parent widget', () => {
      const parent = store.addWidget('column')
      const child = store.addChildWidget(parent.id, 'text')
      vi.clearAllMocks()
      store.removeChildWidget(parent.id, child!.id)
      expect(store.findWidgetById(parent.id)!.children).toHaveLength(0)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })

    it('does nothing for non-existent parent', () => {
      vi.clearAllMocks()
      store.removeChildWidget('nonexistent', 'child-id')
      expect(mockEditorStore.markAsDirty).not.toHaveBeenCalled()
    })
  })

  describe('updateWidgetChildren', () => {
    it('replaces children array', () => {
      const parent = store.addWidget('column')
      const newChildren = [
        { id: 'c1', type: 'text' as const, order: 0, content: { text: 'a' }, styles: {} },
        { id: 'c2', type: 'text' as const, order: 1, content: { text: 'b' }, styles: {} },
      ]
      store.updateWidgetChildren(parent.id, newChildren)
      expect(store.findWidgetById(parent.id)!.children).toHaveLength(2)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })
  })

  describe('moveWidget', () => {
    it('moves widget from one position to another', () => {
      store.addWidget('title')
      store.addWidget('text')
      store.addWidget('button')
      // Move first widget to last position
      store.moveWidget(0, 2)
      expect(store.items[0].type).toBe('text')
      expect(store.items[1].type).toBe('button')
      expect(store.items[2].type).toBe('title')
    })

    it('reorders after moving', () => {
      store.addWidget('title')
      store.addWidget('text')
      store.addWidget('button')
      store.moveWidget(0, 2)
      expect(store.items[0].order).toBe(0)
      expect(store.items[1].order).toBe(1)
      expect(store.items[2].order).toBe(2)
    })

    it('marks dirty after move', () => {
      store.addWidget('title')
      store.addWidget('text')
      vi.clearAllMocks()
      store.moveWidget(0, 1)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })
  })

  describe('duplicateWidget', () => {
    it('creates a clone after the original', () => {
      store.addWidget('title')
      const original = store.addWidget('text')
      store.addWidget('button')
      const duplicate = store.duplicateWidget(original.id)
      expect(duplicate).toBeDefined()
      expect(duplicate!.type).toBe('text')
      expect(duplicate!.id).not.toBe(original.id)
      // Duplicate should be right after original (index 2)
      expect(store.items[2].id).toBe(duplicate!.id)
      expect(store.items.length).toBe(4)
    })

    it('does nothing for non-existent widget', () => {
      const result = store.duplicateWidget('nonexistent')
      expect(result).toBeUndefined()
    })

    it('marks dirty after duplicate', () => {
      const widget = store.addWidget('title')
      vi.clearAllMocks()
      store.duplicateWidget(widget.id)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })
  })

  describe('deepCloneWidget', () => {
    it('generates unique ids at all nesting levels', () => {
      const parent = store.addWidget('row')
      // Row gets 2 column children automatically
      const child = store.addChildWidget(parent.children![0].id, 'text')

      const clone = store.deepCloneWidget(parent)
      expect(clone.id).not.toBe(parent.id)
      expect(clone.children).toHaveLength(2)
      expect(clone.children![0].id).not.toBe(parent.children![0].id)
      expect(clone.children![1].id).not.toBe(parent.children![1].id)
      // Nested grandchild
      expect(clone.children![0].children).toHaveLength(1)
      expect(clone.children![0].children![0].id).not.toBe(child!.id)
    })

    it('preserves content and styles in clone', () => {
      const widget = store.addWidget('text')
      store.updateWidget(widget.id, {
        content: { text: 'cloned text' },
        styles: { color: 'green' },
      })

      const clone = store.deepCloneWidget(store.findWidgetById(widget.id)!)
      expect(clone.content.text).toBe('cloned text')
      expect(clone.styles.color).toBe('green')
    })
  })

  describe('sortedItems', () => {
    it('returns items sorted by order', () => {
      store.setWidgets([
        { id: 'w3', type: 'text', order: 2, content: {}, styles: {} },
        { id: 'w1', type: 'title', order: 0, content: {}, styles: {} },
        { id: 'w2', type: 'button', order: 1, content: {}, styles: {} },
      ])
      const sorted = store.sortedItems
      expect(sorted[0].id).toBe('w1')
      expect(sorted[1].id).toBe('w2')
      expect(sorted[2].id).toBe('w3')
    })
  })

  describe('count', () => {
    it('reflects items length', () => {
      expect(store.count).toBe(0)
      store.addWidget('title')
      expect(store.count).toBe(1)
      store.addWidget('text')
      expect(store.count).toBe(2)
    })
  })

  describe('findWidgetById', () => {
    it('finds root-level widget', () => {
      const widget = store.addWidget('title')
      expect(store.findWidgetById(widget.id)).toBeDefined()
      expect(store.findWidgetById(widget.id)!.type).toBe('title')
    })

    it('finds nested child widget', () => {
      const parent = store.addWidget('column')
      const child = store.addChildWidget(parent.id, 'text')
      expect(store.findWidgetById(child!.id)).toBeDefined()
      expect(store.findWidgetById(child!.id)!.type).toBe('text')
    })

    it('returns undefined for non-existent id', () => {
      expect(store.findWidgetById('nonexistent')).toBeUndefined()
    })
  })

  describe('widgetIndex', () => {
    it('includes nested children in index', () => {
      const parent = store.addWidget('column')
      const child = store.addChildWidget(parent.id, 'text')
      // widgetIndex is a computed Map - test via findWidgetById which uses it
      expect(store.findWidgetById(parent.id)).toBeDefined()
      expect(store.findWidgetById(child!.id)).toBeDefined()
    })
  })

  describe('setDraggedWidgetType', () => {
    it('sets the dragged widget type', () => {
      store.setDraggedWidgetType('button')
      expect(store.draggedWidgetType).toBe('button')
    })

    it('clears with null', () => {
      store.setDraggedWidgetType('button')
      store.setDraggedWidgetType(null)
      expect(store.draggedWidgetType).toBeNull()
    })
  })

  describe('clear', () => {
    it('removes all widgets and marks dirty', () => {
      store.addWidget('title')
      store.addWidget('text')
      vi.clearAllMocks()
      store.clear()
      expect(store.items.length).toBe(0)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })
  })

  describe('setWidgets', () => {
    it('replaces all items', () => {
      store.addWidget('title')
      store.setWidgets([
        { id: 'a', type: 'text', order: 0, content: {}, styles: {} },
      ])
      expect(store.items.length).toBe(1)
      expect(store.items[0].id).toBe('a')
    })
  })
})
