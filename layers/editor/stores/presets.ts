import type { SectionPreset, TemplatePreset } from '../types/preset'
import {
  getSectionById as getSectionByIdFromConfig,
  getSectionsByCategory,
  getTemplateById as getTemplateByIdFromConfig,
  getTemplatesByCategory,
  searchSections,
  searchTemplates,
  sectionCategories,
  sectionPresets,
  templateCategories,
  templatePresets,
} from '../config/presets'
import { useEditorStore } from './editor'
import { useWidgetsStore } from './widgets'

export const usePresetsStore = defineStore('presets', () => {
  const editorStore = useEditorStore()
  const widgetsStore = useWidgetsStore()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const selectedTemplate = ref<TemplatePreset | null>(null)
  const isApplyModalOpen = ref(false)

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  const templates = computed(() => templatePresets)
  const sections = computed(() => sectionPresets)
  const templateCategoryList = computed(() => templateCategories)
  const sectionCategoryList = computed(() => sectionCategories)

  // ---------------------------------------------------------------------------
  // Actions - Modal
  // ---------------------------------------------------------------------------
  function openApplyModal(template: TemplatePreset) {
    selectedTemplate.value = template
    isApplyModalOpen.value = true
  }

  function closeApplyModal() {
    selectedTemplate.value = null
    isApplyModalOpen.value = false
  }

  // ---------------------------------------------------------------------------
  // Actions - Apply Template
  // ---------------------------------------------------------------------------
  function applyTemplate(template: TemplatePreset) {
    // Update global styles
    editorStore.updateGlobalStyles(template.globalStyles)

    // Clone widgets with new IDs
    const clonedWidgets = template.widgets.map(w => widgetsStore.deepCloneWidget(w))

    // Reorder cloned widgets
    clonedWidgets.forEach((widget, index) => {
      widget.order = index
    })

    // Replace all widgets
    widgetsStore.setWidgets(clonedWidgets)

    // Mark as dirty for auto-save
    editorStore.markAsDirty()

    // Close modal
    closeApplyModal()
  }

  // ---------------------------------------------------------------------------
  // Actions - Add Section
  // ---------------------------------------------------------------------------
  function addSection(section: SectionPreset, insertIndex?: number) {
    const currentCount = widgetsStore.items.length

    // Clone section widgets with new IDs
    section.widgets.forEach((widget, i) => {
      const cloned = widgetsStore.deepCloneWidget(widget)
      const targetIndex = insertIndex !== undefined ? insertIndex + i : currentCount + i
      cloned.order = targetIndex

      // Add to items
      if (insertIndex !== undefined) {
        widgetsStore.items.splice(targetIndex, 0, cloned)
      }
      else {
        widgetsStore.items.push(cloned)
      }
    })

    // Reorder all widgets
    widgetsStore.reorderWidgets()

    // Mark as dirty
    editorStore.markAsDirty()
  }

  // ---------------------------------------------------------------------------
  // Actions - Search and Filter
  // ---------------------------------------------------------------------------
  function filterTemplates(query: string, category?: string): TemplatePreset[] {
    let results = query ? searchTemplates(query) : templatePresets

    if (category) {
      results = results.filter(t => t.category === category)
    }

    return results
  }

  function filterSections(query: string, category?: string): SectionPreset[] {
    let results = query ? searchSections(query) : sectionPresets

    if (category) {
      results = results.filter(s => s.category === category)
    }

    return results
  }

  // ---------------------------------------------------------------------------
  // Actions - Getters by ID/Category
  // ---------------------------------------------------------------------------
  function getTemplateById(id: string): TemplatePreset | undefined {
    return getTemplateByIdFromConfig(id)
  }

  function getSectionById(id: string): SectionPreset | undefined {
    return getSectionByIdFromConfig(id)
  }

  function getTemplatesForCategory(category: string): TemplatePreset[] {
    return getTemplatesByCategory(category)
  }

  function getSectionsForCategory(category: string): SectionPreset[] {
    return getSectionsByCategory(category)
  }

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // State
    selectedTemplate,
    isApplyModalOpen,

    // Getters
    templates,
    sections,
    templateCategoryList,
    sectionCategoryList,

    // Actions - Modal
    openApplyModal,
    closeApplyModal,

    // Actions - Apply
    applyTemplate,
    addSection,

    // Actions - Search/Filter
    filterTemplates,
    filterSections,

    // Actions - Getters
    getTemplateById,
    getSectionById,
    getTemplatesForCategory,
    getSectionsForCategory,
  }
})
