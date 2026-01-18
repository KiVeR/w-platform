import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type EditorMode = 'designer' | 'preview' | 'expert' | 'history'
export type PreviewDevice = 'mobile' | 'tablet' | 'desktop'
export type OptionsTab = 'content' | 'style'

export const useUIStore = defineStore('ui', () => {
  // State
  const mode = ref<EditorMode>('designer')
  const previousMode = ref<EditorMode>('designer')
  const previewDevice = ref<PreviewDevice>('mobile')
  const leftSidebarOpen = ref(true)
  const rightSidebarOpen = ref(true)
  const activeTab = ref<OptionsTab>('content')

  // Computed
  const isReadOnly = computed(() => mode.value === 'history' || mode.value === 'preview')
  const isHistoryMode = computed(() => mode.value === 'history')

  // Actions
  function setMode(newMode: EditorMode) {
    mode.value = newMode
  }

  function setPreviewDevice(device: PreviewDevice) {
    previewDevice.value = device
  }

  function toggleLeftSidebar() {
    leftSidebarOpen.value = !leftSidebarOpen.value
  }

  function toggleRightSidebar() {
    rightSidebarOpen.value = !rightSidebarOpen.value
  }

  function setActiveTab(tab: OptionsTab) {
    activeTab.value = tab
  }

  function openLeftSidebar() {
    leftSidebarOpen.value = true
  }

  function closeLeftSidebar() {
    leftSidebarOpen.value = false
  }

  function openRightSidebar() {
    rightSidebarOpen.value = true
  }

  function closeRightSidebar() {
    rightSidebarOpen.value = false
  }

  function enterHistoryMode() {
    if (mode.value !== 'history') {
      previousMode.value = mode.value
      mode.value = 'history'
      // Force right sidebar open for version list
      rightSidebarOpen.value = true
    }
  }

  function exitHistoryMode() {
    mode.value = previousMode.value
  }

  return {
    // State
    mode,
    previousMode,
    previewDevice,
    leftSidebarOpen,
    rightSidebarOpen,
    activeTab,
    // Computed
    isReadOnly,
    isHistoryMode,
    // Actions
    setMode,
    setPreviewDevice,
    toggleLeftSidebar,
    toggleRightSidebar,
    setActiveTab,
    openLeftSidebar,
    closeLeftSidebar,
    openRightSidebar,
    closeRightSidebar,
    enterHistoryMode,
    exitHistoryMode,
  }
})
