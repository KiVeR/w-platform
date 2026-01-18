import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Mock components
vi.mock('@/components/history/VersionList.vue', () => ({
  default: {
    name: 'VersionList',
    template: '<div class="mock-version-list"><slot /></div>',
    props: ['versions', 'selectedId', 'isLoading', 'hasMore'],
  },
}))

vi.mock('@/components/history/RestoreConfirmModal.vue', () => ({
  default: {
    name: 'RestoreConfirmModal',
    template: '<div class="mock-restore-modal"><slot /></div>',
    props: ['versionNumber'],
  },
}))

// Use real Vue refs for reactivity
const mockVersions = ref([])
const mockSelectedVersion = ref(null)
const mockIsLoading = ref(false)
const mockIsRestoring = ref(false)
const mockHasMore = ref(false)

// Create mock functions outside so they persist across calls
const mockLoadMore = vi.fn()
const mockSelectVersion = vi.fn()
const mockRestoreVersion = vi.fn()
const mockExitHistoryMode = vi.fn()
const mockEnterHistoryMode = vi.fn()
const mockNavigateToHistory = vi.fn()
const mockNavigateToEditor = vi.fn()
const mockClearCache = vi.fn()

vi.mock('@/composables/useVersionHistory', () => ({
  useVersionHistory: () => ({
    versions: mockVersions,
    selectedVersion: mockSelectedVersion,
    isLoading: mockIsLoading,
    isRestoring: mockIsRestoring,
    isActive: ref(true),
    hasMore: mockHasMore,
    loadMore: mockLoadMore,
    selectVersion: mockSelectVersion,
    restoreVersion: mockRestoreVersion,
    exitHistoryMode: mockExitHistoryMode,
    enterHistoryMode: mockEnterHistoryMode,
    navigateToHistory: mockNavigateToHistory,
    navigateToEditor: mockNavigateToEditor,
    clearCache: mockClearCache,
  }),
}))

describe('versionHistorySidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset all mock values
    mockVersions.value = []
    mockSelectedVersion.value = null
    mockIsLoading.value = false
    mockIsRestoring.value = false
    mockHasMore.value = false
    vi.clearAllMocks()
  })

  it('renders the sidebar', async () => {
    const VersionHistorySidebar = (await import('@/components/history/VersionHistorySidebar.vue')).default
    const wrapper = mount(VersionHistorySidebar)

    expect(wrapper.find('.version-history-sidebar').exists()).toBe(true)
  })

  it('has correct ARIA attributes', async () => {
    const VersionHistorySidebar = (await import('@/components/history/VersionHistorySidebar.vue')).default
    const wrapper = mount(VersionHistorySidebar)

    const sidebar = wrapper.find('.version-history-sidebar')
    expect(sidebar.attributes('role')).toBe('region')
    expect(sidebar.attributes('aria-label')).toBe('Historique des versions')
  })

  it('displays correct title', async () => {
    const VersionHistorySidebar = (await import('@/components/history/VersionHistorySidebar.vue')).default
    const wrapper = mount(VersionHistorySidebar)

    expect(wrapper.find('.header-title h2').text()).toBe('Historique')
  })

  it('calls navigateToEditor when close button is clicked', async () => {
    const VersionHistorySidebar = (await import('@/components/history/VersionHistorySidebar.vue')).default
    const wrapper = mount(VersionHistorySidebar)

    await wrapper.find('.btn-close').trigger('click')
    expect(mockNavigateToEditor).toHaveBeenCalled()
  })

  it('shows restore button when non-latest version is selected', async () => {
    // Set state BEFORE mounting
    mockIsRestoring.value = false
    mockSelectedVersion.value = {
      id: 1,
      version: '1.5',
      isLatest: false,
      createdAt: new Date().toISOString(),
      design: { widgets: [], globalStyles: {} },
    }

    const VersionHistorySidebar = (await import('@/components/history/VersionHistorySidebar.vue')).default
    const wrapper = mount(VersionHistorySidebar)

    expect(wrapper.find('.btn-restore').exists()).toBe(true)
    expect(wrapper.find('.btn-restore').text()).toContain('Restaurer cette version')
  })

  it('shows current notice when latest version is selected', async () => {
    // Set state BEFORE mounting
    mockIsRestoring.value = false
    mockSelectedVersion.value = {
      id: 1,
      version: '1.6',
      isLatest: true,
      createdAt: new Date().toISOString(),
      design: { widgets: [], globalStyles: {} },
    }

    const VersionHistorySidebar = (await import('@/components/history/VersionHistorySidebar.vue')).default
    const wrapper = mount(VersionHistorySidebar)

    expect(wrapper.find('.current-notice').exists()).toBe(true)
    expect(wrapper.find('.current-notice').text()).toContain('déjà active')
  })

  it('disables restore button while restoring', async () => {
    // Set state BEFORE mounting
    mockSelectedVersion.value = {
      id: 1,
      version: '1.5',
      isLatest: false,
      createdAt: new Date().toISOString(),
      design: { widgets: [], globalStyles: {} },
    }
    mockIsRestoring.value = true

    const VersionHistorySidebar = (await import('@/components/history/VersionHistorySidebar.vue')).default
    const wrapper = mount(VersionHistorySidebar)

    const restoreBtn = wrapper.find('.btn-restore')
    expect(restoreBtn.attributes('disabled')).toBeDefined()
    expect(restoreBtn.text()).toContain('Restauration...')
  })
})
