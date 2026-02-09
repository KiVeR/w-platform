import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Stub Vue auto-imports for module collection
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

const { useUIStore } = await import('#editor/stores/ui')

describe('useUIStore', () => {
  let store: ReturnType<typeof useUIStore>

  beforeEach(() => {
    // Re-stub after unstubGlobals clears them
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
    store = useUIStore()
  })

  describe('initial state', () => {
    it('has designer mode by default', () => {
      expect(store.mode).toBe('designer')
    })

    it('has mobile preview device by default', () => {
      expect(store.previewDevice).toBe('mobile')
    })

    it('has both sidebars open by default', () => {
      expect(store.leftSidebarOpen).toBe(true)
      expect(store.rightSidebarOpen).toBe(true)
    })

    it('has content as default active tab', () => {
      expect(store.activeTab).toBe('content')
    })

    it('has no campaign context by default', () => {
      expect(store.currentCampaignId).toBeNull()
      expect(store.currentContentType).toBeNull()
    })
  })

  describe('setMode', () => {
    it('transitions to expert mode', () => {
      store.setMode('expert')
      expect(store.mode).toBe('expert')
    })

    it('transitions to preview mode and saves sidebar state', () => {
      store.setMode('preview')
      expect(store.mode).toBe('preview')
      expect(store.leftSidebarOpen).toBe(false)
      expect(store.rightSidebarOpen).toBe(false)
    })

    it('saves sidebar state when entering preview mode', () => {
      store.closeLeftSidebar()
      // left=false, right=true
      store.setMode('preview')
      expect(store.leftSidebarOpen).toBe(false)
      expect(store.rightSidebarOpen).toBe(false)

      // Restore should bring back left=false, right=true
      store.setMode('designer')
      expect(store.leftSidebarOpen).toBe(false)
      expect(store.rightSidebarOpen).toBe(true)
    })

    it('restores sidebar state when leaving preview mode', () => {
      // Both sidebars open initially
      store.setMode('preview')
      store.setMode('designer')
      expect(store.leftSidebarOpen).toBe(true)
      expect(store.rightSidebarOpen).toBe(true)
    })

    it('does not restore sidebar state when transitioning between non-preview modes', () => {
      store.closeRightSidebar()
      store.setMode('expert')
      expect(store.rightSidebarOpen).toBe(false)
    })
  })

  describe('enterHistoryMode', () => {
    it('saves previous mode and enters history mode', () => {
      store.setMode('expert')
      store.enterHistoryMode()
      expect(store.mode).toBe('history')
      expect(store.previousMode).toBe('expert')
    })

    it('forces right sidebar open', () => {
      store.closeRightSidebar()
      store.enterHistoryMode()
      expect(store.rightSidebarOpen).toBe(true)
    })

    it('does nothing if already in history mode', () => {
      store.enterHistoryMode()
      const previousMode = store.previousMode
      store.enterHistoryMode()
      expect(store.previousMode).toBe(previousMode)
    })
  })

  describe('exitHistoryMode', () => {
    it('restores the previous mode', () => {
      store.setMode('expert')
      store.enterHistoryMode()
      store.exitHistoryMode()
      expect(store.mode).toBe('expert')
    })

    it('restores designer mode by default', () => {
      store.enterHistoryMode()
      store.exitHistoryMode()
      expect(store.mode).toBe('designer')
    })
  })

  describe('sidebar actions', () => {
    it('toggleLeftSidebar toggles the left sidebar', () => {
      expect(store.leftSidebarOpen).toBe(true)
      store.toggleLeftSidebar()
      expect(store.leftSidebarOpen).toBe(false)
      store.toggleLeftSidebar()
      expect(store.leftSidebarOpen).toBe(true)
    })

    it('toggleRightSidebar toggles the right sidebar', () => {
      expect(store.rightSidebarOpen).toBe(true)
      store.toggleRightSidebar()
      expect(store.rightSidebarOpen).toBe(false)
      store.toggleRightSidebar()
      expect(store.rightSidebarOpen).toBe(true)
    })

    it('openLeftSidebar opens the left sidebar', () => {
      store.closeLeftSidebar()
      store.openLeftSidebar()
      expect(store.leftSidebarOpen).toBe(true)
    })

    it('closeLeftSidebar closes the left sidebar', () => {
      store.closeLeftSidebar()
      expect(store.leftSidebarOpen).toBe(false)
    })

    it('openRightSidebar opens the right sidebar', () => {
      store.closeRightSidebar()
      store.openRightSidebar()
      expect(store.rightSidebarOpen).toBe(true)
    })

    it('closeRightSidebar closes the right sidebar', () => {
      store.closeRightSidebar()
      expect(store.rightSidebarOpen).toBe(false)
    })
  })

  describe('setPreviewDevice', () => {
    it('changes to tablet', () => {
      store.setPreviewDevice('tablet')
      expect(store.previewDevice).toBe('tablet')
    })

    it('changes to desktop', () => {
      store.setPreviewDevice('desktop')
      expect(store.previewDevice).toBe('desktop')
    })
  })

  describe('setActiveTab', () => {
    it('changes to style tab', () => {
      store.setActiveTab('style')
      expect(store.activeTab).toBe('style')
    })

    it('changes back to content tab', () => {
      store.setActiveTab('style')
      store.setActiveTab('content')
      expect(store.activeTab).toBe('content')
    })
  })

  describe('isReadOnly', () => {
    it('returns false for designer mode', () => {
      expect(store.isReadOnly).toBe(false)
    })

    it('returns false for expert mode', () => {
      store.setMode('expert')
      expect(store.isReadOnly).toBe(false)
    })

    it('returns true for preview mode', () => {
      store.setMode('preview')
      expect(store.isReadOnly).toBe(true)
    })

    it('returns true for history mode', () => {
      store.enterHistoryMode()
      expect(store.isReadOnly).toBe(true)
    })
  })

  describe('mode getters', () => {
    it('isHistoryMode reflects history mode', () => {
      expect(store.isHistoryMode).toBe(false)
      store.enterHistoryMode()
      expect(store.isHistoryMode).toBe(true)
    })

    it('isPreviewMode reflects preview mode', () => {
      expect(store.isPreviewMode).toBe(false)
      store.setMode('preview')
      expect(store.isPreviewMode).toBe(true)
    })
  })

  describe('campaign context', () => {
    it('setCampaignContext sets campaign id and content type', () => {
      store.setCampaignContext(42, 'landing-page')
      expect(store.currentCampaignId).toBe(42)
      expect(store.currentContentType).toBe('landing-page')
      expect(store.isInCampaignContext).toBe(true)
    })

    it('clearCampaignContext nullifies campaign context', () => {
      store.setCampaignContext(42, 'rcs')
      store.clearCampaignContext()
      expect(store.currentCampaignId).toBeNull()
      expect(store.currentContentType).toBeNull()
      expect(store.isInCampaignContext).toBe(false)
    })
  })

  describe('content type getters', () => {
    it('isLandingPageEditor is true when content type is landing-page', () => {
      store.setCampaignContext(1, 'landing-page')
      expect(store.isLandingPageEditor).toBe(true)
      expect(store.isRCSEditor).toBe(false)
      expect(store.isSMSEditor).toBe(false)
    })

    it('isRCSEditor is true when content type is rcs', () => {
      store.setCampaignContext(1, 'rcs')
      expect(store.isRCSEditor).toBe(true)
      expect(store.isLandingPageEditor).toBe(false)
    })

    it('isSMSEditor is true when content type is sms', () => {
      store.setCampaignContext(1, 'sms')
      expect(store.isSMSEditor).toBe(true)
      expect(store.isLandingPageEditor).toBe(false)
    })
  })
})
