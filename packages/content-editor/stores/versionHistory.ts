const PAGE_SIZE = 10
const CACHE_MAX_SIZE = 5

export const useVersionHistoryStore = defineStore('versionHistory', () => {
  const editorStore = useEditorStore()
  const widgetsStore = useWidgetsStore()
  const uiStore = useUIStore()
  const contentStore = useContentStore()

  const versions = ref<VersionSummary[]>([])
  const selectedVersion = ref<VersionDetail | null>(null)
  const isLoading = ref(false)
  const isLoadingVersion = ref(false)
  const isRestoring = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const total = ref(0)
  const rateLimit = ref<RateLimitInfo | null>(null)

  const versionCache = new Map<number, VersionDetail>()

  const isActive = computed(() => uiStore.isHistoryMode)

  // The API client is injected by useVersionHistory() at setup time.
  // Pinia actions run outside Vue's setup() scope, so inject() cannot be
  // called lazily from within store actions.
  let _contentVersionApi: ContentVersionApi | null = null
  function setApi(api: ContentVersionApi) {
    _contentVersionApi = api
  }
  function getContentVersionApi() {
    if (!_contentVersionApi) {
      throw new Error('[versionHistory] API not initialized. Call useVersionHistory() first.')
    }
    return _contentVersionApi
  }

  async function loadVersions(): Promise<void> {
    const contentId = contentStore.id
    if (!contentId)
      return

    isLoading.value = true
    currentPage.value = 1
    versions.value = []

    try {
      const response = await getContentVersionApi().getVersions(
        contentId,
        { page: 1, pageSize: PAGE_SIZE },
      )

      if (response) {
        versions.value = response.versions
        total.value = response.pagination.total
        hasMore.value = response.pagination.page < response.pagination.totalPages
        rateLimit.value = response.rateLimit
      }
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    const contentId = contentStore.id
    if (!contentId || isLoading.value || !hasMore.value)
      return

    isLoading.value = true
    currentPage.value++

    try {
      const response = await getContentVersionApi().getVersions(
        contentId,
        { page: currentPage.value, pageSize: PAGE_SIZE },
      )

      if (response) {
        versions.value = [...versions.value, ...response.versions]
        hasMore.value = response.pagination.page < response.pagination.totalPages
        rateLimit.value = response.rateLimit
      }
    }
    finally {
      isLoading.value = false
    }
  }

  async function selectVersion(versionId: number): Promise<void> {
    const contentId = contentStore.id
    if (!contentId)
      return

    if (versionCache.has(versionId)) {
      selectedVersion.value = versionCache.get(versionId)!
      return
    }

    isLoadingVersion.value = true

    try {
      const response = await getContentVersionApi().getVersion(
        contentId,
        versionId,
      )

      if (response) {
        if (versionCache.size >= CACHE_MAX_SIZE) {
          const firstKey = versionCache.keys().next().value!
          versionCache.delete(firstKey)
        }
        versionCache.set(versionId, response)
        selectedVersion.value = response
      }
    }
    finally {
      isLoadingVersion.value = false
    }
  }

  async function restoreVersion(versionId: number): Promise<boolean> {
    const contentId = contentStore.id
    if (!contentId)
      return false

    isRestoring.value = true

    try {
      const response = await getContentVersionApi().restoreVersion(
        contentId,
        versionId,
      )

      if (response && selectedVersion.value) {
        editorStore.setDesign(selectedVersion.value.design)
        widgetsStore.setWidgets(selectedVersion.value.design.widgets)
        editorStore.markAsSaved()
        rateLimit.value = response.rateLimit
        loadVersions()
        return true
      }

      return false
    }
    finally {
      isRestoring.value = false
      versionCache.clear()
      exitHistoryMode()
    }
  }

  async function enterHistoryMode(): Promise<void> {
    uiStore.enterHistoryMode()
    await loadVersions()
    const firstVersion = versions.value[0]
    if (firstVersion)
      await selectVersion(firstVersion.id)
  }

  function exitHistoryMode(): void {
    selectedVersion.value = null
    uiStore.exitHistoryMode()
  }

  function clearCache(): void {
    versionCache.clear()
  }

  return {
    versions,
    selectedVersion,
    isLoading,
    isLoadingVersion,
    isRestoring,
    isActive,
    hasMore,
    total,
    rateLimit,

    setApi,
    loadVersions,
    loadMore,
    selectVersion,
    restoreVersion,
    enterHistoryMode,
    exitHistoryMode,
    clearCache,
  }
})
