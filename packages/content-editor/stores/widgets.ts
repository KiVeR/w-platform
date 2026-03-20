import { v4 as uuidv4 } from 'uuid'

export const useWidgetsStore = defineStore('widgets', () => {
  const editorStore = useEditorStore()

  // State
  const items = ref<Widget[]>([])
  const draggedWidgetType = ref<WidgetType | null>(null)

  // Getters
  const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => a.order - b.order)
  })

  const count = computed(() => items.value.length)

  // Widget index for O(1) lookups (includes nested children)
  const widgetIndex = computed(() => {
    const index = new Map<string, Widget>()

    function indexWidgets(widgets: Widget[]) {
      for (const widget of widgets) {
        index.set(widget.id, widget)
        if (widget.children) {
          indexWidgets(widget.children)
        }
      }
    }

    indexWidgets(items.value)
    return index
  })

  // Actions
  function setWidgets(widgets: Widget[]) {
    items.value = widgets
  }

  function createWidget(type: WidgetType): Widget {
    const config = getWidgetConfig(type)
    if (!config) {
      throw new Error(`Unknown widget type: ${type}`)
    }

    const widget: Widget = {
      id: uuidv4(),
      type,
      order: items.value.length,
      content: { ...config.defaultContent },
      styles: { ...config.defaultStyles },
    }

    // Initialize children for container widgets
    if (config.canHaveChildren) {
      widget.children = []
    }

    return widget
  }

  function addWidget(type: WidgetType, index?: number) {
    const widget = createWidget(type)

    // Rows start with 2 default columns
    if (type === 'row') {
      widget.children = [
        createWidget('column'),
        createWidget('column'),
      ]
    }

    if (index !== undefined) {
      items.value.splice(index, 0, widget)
      reorderWidgets()
    }
    else {
      widget.order = items.value.length
      items.value.push(widget)
    }

    editorStore.markAsDirty()
    return widget
  }

  function removeWidget(id: string) {
    const index = items.value.findIndex(w => w.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
      reorderWidgets()
      editorStore.markAsDirty()
    }
  }

  function updateWidget(id: string, updates: Partial<Pick<Widget, 'content' | 'styles'>>) {
    const widget = findWidgetById(id)
    if (widget) {
      if (updates.content) {
        widget.content = { ...widget.content, ...updates.content }
      }
      if (updates.styles) {
        widget.styles = { ...widget.styles, ...updates.styles }
      }
      editorStore.markAsDirty()
    }
  }

  function updateWidgetContent(id: string, content: Partial<WidgetContent>) {
    updateWidget(id, { content })
  }

  function updateWidgetStyles(id: string, styles: Partial<WidgetStyles>) {
    updateWidget(id, { styles })
  }

  function updateWidgetChildren(id: string, children: Widget[]) {
    const widget = findWidgetById(id)
    if (widget) {
      widget.children = children
      editorStore.markAsDirty()
    }
  }

  function addChildWidget(parentId: string, type: WidgetType, index?: number): Widget | null {
    const parent = findWidgetById(parentId)
    if (!parent)
      return null

    if (!parent.children) {
      parent.children = []
    }

    const child = createWidget(type)
    child.order = parent.children.length

    if (index !== undefined) {
      parent.children.splice(index, 0, child)
    }
    else {
      parent.children.push(child)
    }

    editorStore.markAsDirty()
    return child
  }

  function removeChildWidget(parentId: string, childId: string) {
    const parent = findWidgetById(parentId)
    if (!parent || !parent.children)
      return

    const index = parent.children.findIndex(c => c.id === childId)
    if (index !== -1) {
      parent.children.splice(index, 1)
      editorStore.markAsDirty()
    }
  }

  function removeWidgetAnywhere(id: string): boolean {
    // Try top-level first
    const topIndex = items.value.findIndex(w => w.id === id)
    if (topIndex !== -1) {
      items.value.splice(topIndex, 1)
      reorderWidgets()
      editorStore.markAsDirty()
      return true
    }

    // Search recursively in children
    function removeNested(widgets: Widget[]): boolean {
      for (const w of widgets) {
        if (!w.children)
          continue
        const idx = w.children.findIndex(c => c.id === id)
        if (idx !== -1) {
          w.children.splice(idx, 1)
          editorStore.markAsDirty()
          return true
        }
        if (removeNested(w.children))
          return true
      }
      return false
    }

    return removeNested(items.value)
  }

  function moveWidget(fromIndex: number, toIndex: number) {
    const widget = items.value[fromIndex]
    if (!widget)
      return

    items.value.splice(fromIndex, 1)
    items.value.splice(toIndex, 0, widget)
    reorderWidgets()
    editorStore.markAsDirty()
  }

  function reorderWidgets() {
    items.value.forEach((widget, index) => {
      widget.order = index
    })
  }

  function duplicateWidget(id: string) {
    const index = items.value.findIndex(w => w.id === id)
    if (index === -1)
      return

    const widget = items.value[index]
    if (!widget)
      return

    const duplicate = deepCloneWidget(widget)
    items.value.splice(index + 1, 0, duplicate)
    reorderWidgets()
    editorStore.markAsDirty()
    return duplicate
  }

  function deepCloneWidget(widget: Widget): Widget {
    const clone: Widget = {
      ...widget,
      id: uuidv4(),
      content: { ...widget.content },
      styles: { ...widget.styles },
    }

    if (widget.children) {
      clone.children = widget.children.map(child => deepCloneWidget(child))
    }

    return clone
  }

  // O(1) lookup using computed index
  function findWidgetById(id: string): Widget | undefined {
    return widgetIndex.value.get(id)
  }

  function setDraggedWidgetType(type: WidgetType | null) {
    draggedWidgetType.value = type
  }

  function clear() {
    items.value = []
    editorStore.markAsDirty()
  }

  return {
    // State
    items,
    draggedWidgetType,
    // Getters
    sortedItems,
    count,
    // Actions
    setWidgets,
    createWidget,
    addWidget,
    removeWidget,
    updateWidget,
    updateWidgetContent,
    updateWidgetStyles,
    updateWidgetChildren,
    addChildWidget,
    removeChildWidget,
    removeWidgetAnywhere,
    moveWidget,
    reorderWidgets,
    duplicateWidget,
    deepCloneWidget,
    findWidgetById,
    setDraggedWidgetType,
    clear,
  }
})
