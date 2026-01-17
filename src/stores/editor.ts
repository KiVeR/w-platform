import type { DesignDocument, GlobalStyles } from '@/types/widget'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const defaultDesign: DesignDocument = {
  version: '1.0',
  globalStyles: {
    // Theme
    palette: 'turquoise',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    // Brand colors (from turquoise palette)
    primaryColor: '#14b8a6',
    secondaryColor: '#0d9488',
    // Typography
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: '16px',
    lineHeight: '1.6',
    // Layout
    contentPadding: '16px',
    widgetGap: '12px',
    borderRadius: '8px',
    // SEO
    pageTitle: '',
    metaDescription: '',
  },
  widgets: [],
}

export const useEditorStore = defineStore('editor', () => {
  // State
  const landingPageId = ref<number | null>(null)
  const design = ref<DesignDocument>({ ...defaultDesign })
  const isDirty = ref(false)
  const isLoading = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  const error = ref<string | null>(null)

  // Getters
  const globalStyles = computed(() => design.value.globalStyles)
  const hasUnsavedChanges = computed(() => isDirty.value)

  // Actions
  function setLandingPageId(id: number | null) {
    landingPageId.value = id
  }

  function setDesign(newDesign: DesignDocument) {
    design.value = newDesign
    isDirty.value = false
  }

  function updateGlobalStyles(styles: Partial<GlobalStyles>) {
    design.value.globalStyles = {
      ...design.value.globalStyles,
      ...styles,
    }
    isDirty.value = true
  }

  function markAsDirty() {
    isDirty.value = true
  }

  function markAsSaved() {
    isDirty.value = false
    lastSavedAt.value = new Date()
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    design.value = { ...defaultDesign, widgets: [] }
    isDirty.value = false
    error.value = null
  }

  return {
    // State
    landingPageId,
    design,
    isDirty,
    isLoading,
    lastSavedAt,
    error,
    // Getters
    globalStyles,
    hasUnsavedChanges,
    // Actions
    setLandingPageId,
    setDesign,
    updateGlobalStyles,
    markAsDirty,
    markAsSaved,
    setLoading,
    setError,
    reset,
  }
})
