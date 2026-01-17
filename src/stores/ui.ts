import { defineStore } from 'pinia'
import { ref } from 'vue'

export type EditorMode = 'designer' | 'preview' | 'expert'
export type PreviewDevice = 'mobile' | 'tablet' | 'desktop'
export type OptionsTab = 'content' | 'style'

export const useUIStore = defineStore('ui', () => {
  // State
  const mode = ref<EditorMode>('designer')
  const previewDevice = ref<PreviewDevice>('mobile')
  const leftSidebarOpen = ref(true)
  const rightSidebarOpen = ref(true)
  const activeTab = ref<OptionsTab>('content')

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

  return {
    // State
    mode,
    previewDevice,
    leftSidebarOpen,
    rightSidebarOpen,
    activeTab,
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
  }
})
