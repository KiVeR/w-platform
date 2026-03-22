import { vi } from 'vitest'

export function stubEditorConfig(overrides: Record<string, unknown> = {}) {
  const config = {
    apiBaseUrl: '/api/v1',
    getAuthToken: () => 'test-token',
    refreshToken: vi.fn().mockResolvedValue('new-token'),
    onContentCreated: vi.fn(),
    onNavigateToHistory: vi.fn(),
    onNavigateToEditor: vi.fn(),
    onAuthFailure: vi.fn(),
    ...overrides,
  }
  vi.stubGlobal('useEditorConfig', () => config)
  return config
}

export function stubEditorApi(overrides: Record<string, unknown> = {}) {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  }
  vi.stubGlobal('useEditorApi', () => api)
  return api
}

export function stubContentApi(overrides: Record<string, unknown> = {}) {
  const api = {
    createContent: vi.fn(),
    loadDesign: vi.fn(),
    saveDesign: vi.fn(),
    updateContent: vi.fn(),
    deleteContent: vi.fn(),
    ...overrides,
  }
  vi.stubGlobal('useContentApi', () => api)
  return api
}

export function stubContentVersionApi(overrides: Record<string, unknown> = {}) {
  const api = {
    getVersions: vi.fn(),
    getVersion: vi.fn(),
    restoreVersion: vi.fn(),
    ...overrides,
  }
  vi.stubGlobal('useContentVersionApi', () => api)
  return api
}

export function stubLocalStorageService(overrides: Record<string, unknown> = {}) {
  const service = {
    saveBackup: vi.fn(),
    loadBackup: vi.fn().mockReturnValue(null),
    clearBackup: vi.fn(),
    hasNewerBackup: vi.fn().mockReturnValue(false),
    listBackups: vi.fn().mockReturnValue([]),
    cleanOldBackups: vi.fn(),
    ...overrides,
  }
  vi.stubGlobal('localStorageService', service)
  return service
}

export function stubUIStore(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'designer',
    isHistoryMode: false,
    enterHistoryMode: vi.fn(),
    exitHistoryMode: vi.fn(),
    ...overrides,
  }
}

export function stubVariableSchemaStore(overrides: Record<string, unknown> = {}) {
  const store = {
    schema: null,
    isLoading: false,
    error: null,
    selectedPreviewSetKey: null,
    isAvailable: false,
    globalVariables: [],
    recipientVariables: [],
    allVariables: [],
    variableNames: [],
    mergedPreviewData: {},
    globalDataSets: [],
    setSchema: vi.fn(),
    clearSchema: vi.fn(),
    setPreviewSetKey: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  }
  vi.stubGlobal('useVariableSchemaStore', () => store)
  return store
}
