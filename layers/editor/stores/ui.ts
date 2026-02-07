import type { ContentType } from '#shared/types/content'
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

  // Preview mode sidebar state preservation
  const sidebarStateBeforePreview = ref<{ left: boolean, right: boolean } | null>(null)

  // Campaign context
  const currentCampaignId = ref<number | null>(null)
  const currentContentType = ref<ContentType | null>(null)

  // Computed
  const isReadOnly = computed(() => mode.value === 'history' || mode.value === 'preview')
  const isHistoryMode = computed(() => mode.value === 'history')
  const isPreviewMode = computed(() => mode.value === 'preview')
  const isInCampaignContext = computed(() => currentCampaignId.value !== null)
  const isLandingPageEditor = computed(() => currentContentType.value === 'landing-page')
  const isRCSEditor = computed(() => currentContentType.value === 'rcs')
  const isSMSEditor = computed(() => currentContentType.value === 'sms')

  // Actions
  function setMode(newMode: EditorMode) {
    const oldMode = mode.value

    // Entering preview mode → save sidebar state and hide them
    if (newMode === 'preview' && oldMode !== 'preview') {
      sidebarStateBeforePreview.value = {
        left: leftSidebarOpen.value,
        right: rightSidebarOpen.value,
      }
      leftSidebarOpen.value = false
      rightSidebarOpen.value = false
    }

    // Exiting preview mode → restore sidebar state
    if (oldMode === 'preview' && newMode !== 'preview' && sidebarStateBeforePreview.value) {
      leftSidebarOpen.value = sidebarStateBeforePreview.value.left
      rightSidebarOpen.value = sidebarStateBeforePreview.value.right
      sidebarStateBeforePreview.value = null
    }

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

  function setCampaignContext(campaignId: number, contentType: ContentType) {
    currentCampaignId.value = campaignId
    currentContentType.value = contentType
  }

  function clearCampaignContext() {
    currentCampaignId.value = null
    currentContentType.value = null
  }

  return {
    // State
    mode,
    previousMode,
    previewDevice,
    leftSidebarOpen,
    rightSidebarOpen,
    activeTab,
    currentCampaignId,
    currentContentType,
    // Computed
    isReadOnly,
    isHistoryMode,
    isPreviewMode,
    isInCampaignContext,
    isLandingPageEditor,
    isRCSEditor,
    isSMSEditor,
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
    setCampaignContext,
    clearCampaignContext,
  }
})
