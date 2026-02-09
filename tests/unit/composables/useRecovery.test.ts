import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createTestDesignDocument, createTestWidget } from '../../helpers/factories'
import { stubLocalStorageService } from '../../helpers/stubs'

// Stub Vue auto-imports
vi.stubGlobal('ref', ref)

// Stub Pinia stores used by useRecovery
const mockEditorStore = {
  setDesign: vi.fn(),
  markAsDirty: vi.fn(),
}
vi.stubGlobal('useEditorStore', () => mockEditorStore)

const mockWidgetsStore = {
  setWidgets: vi.fn(),
}
vi.stubGlobal('useWidgetsStore', () => mockWidgetsStore)

const mockContentStore = { id: 1 }
vi.stubGlobal('useContentStore', () => mockContentStore)

// Stub localStorageService
const localStore = stubLocalStorageService()

// Import AFTER all auto-import deps are stubbed
const { useRecovery } = await import('#editor/composables/useRecovery')

describe('useRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStore.loadBackup.mockReturnValue(null)
    localStore.hasNewerBackup.mockReturnValue(false)
    mockContentStore.id = 1
  })

  it('has modal closed and recoveryData null initially', () => {
    const { showRecoveryModal, recoveryData } = useRecovery()

    expect(showRecoveryModal.value).toBe(false)
    expect(recoveryData.value).toBeNull()
  })

  describe('checkForRecovery', () => {
    it('returns false when no backup exists', () => {
      const { checkForRecovery } = useRecovery()

      const result = checkForRecovery(1, '2026-01-01T00:00:00Z')

      expect(result).toBe(false)
      expect(localStore.loadBackup).toHaveBeenCalledWith(1)
    })

    it('clears backup and returns false when backup is older than server', () => {
      const design = createTestDesignDocument()
      localStore.loadBackup.mockReturnValue({
        design,
        meta: { savedAt: '2026-01-01T00:00:00Z', widgetCount: 0 },
      })
      localStore.hasNewerBackup.mockReturnValue(false)

      const { checkForRecovery } = useRecovery()
      const result = checkForRecovery(1, '2026-01-02T00:00:00Z')

      expect(result).toBe(false)
      expect(localStore.clearBackup).toHaveBeenCalledWith(1)
    })

    it('shows modal and returns true when backup is newer than server', () => {
      const design = createTestDesignDocument()
      localStore.loadBackup.mockReturnValue({
        design,
        meta: { savedAt: '2026-01-02T00:00:00Z', widgetCount: 3 },
      })
      localStore.hasNewerBackup.mockReturnValue(true)

      const { checkForRecovery, showRecoveryModal } = useRecovery()
      const result = checkForRecovery(1, '2026-01-01T00:00:00Z')

      expect(result).toBe(true)
      expect(showRecoveryModal.value).toBe(true)
    })

    it('populates recoveryData with design, savedAt, and widgetCount', () => {
      const widget = createTestWidget()
      const design = createTestDesignDocument({ widgets: [widget] })
      localStore.loadBackup.mockReturnValue({
        design,
        meta: { savedAt: '2026-01-02T12:00:00Z', widgetCount: 5 },
      })
      localStore.hasNewerBackup.mockReturnValue(true)

      const { checkForRecovery, recoveryData } = useRecovery()
      checkForRecovery(1, null)

      expect(recoveryData.value).toEqual({
        design,
        savedAt: '2026-01-02T12:00:00Z',
        widgetCount: 5,
      })
    })
  })

  describe('restoreBackup', () => {
    it('calls setDesign, setWidgets, and markAsDirty', () => {
      const widget = createTestWidget()
      const design = createTestDesignDocument({ widgets: [widget] })
      localStore.loadBackup.mockReturnValue({
        design,
        meta: { savedAt: '2026-01-02T00:00:00Z', widgetCount: 1 },
      })
      localStore.hasNewerBackup.mockReturnValue(true)

      const { checkForRecovery, restoreBackup } = useRecovery()
      checkForRecovery(1, null)
      restoreBackup()

      expect(mockEditorStore.setDesign).toHaveBeenCalledWith(design)
      expect(mockWidgetsStore.setWidgets).toHaveBeenCalledWith(design.widgets)
      expect(mockEditorStore.markAsDirty).toHaveBeenCalled()
    })

    it('closes modal and clears recoveryData after restore', () => {
      const design = createTestDesignDocument()
      localStore.loadBackup.mockReturnValue({
        design,
        meta: { savedAt: '2026-01-02T00:00:00Z', widgetCount: 0 },
      })
      localStore.hasNewerBackup.mockReturnValue(true)

      const { checkForRecovery, restoreBackup, showRecoveryModal, recoveryData } = useRecovery()
      checkForRecovery(1, null)
      restoreBackup()

      expect(showRecoveryModal.value).toBe(false)
      expect(recoveryData.value).toBeNull()
    })

    it('does nothing when recoveryData is null', () => {
      const { restoreBackup } = useRecovery()
      restoreBackup()

      expect(mockEditorStore.setDesign).not.toHaveBeenCalled()
      expect(mockWidgetsStore.setWidgets).not.toHaveBeenCalled()
      expect(mockEditorStore.markAsDirty).not.toHaveBeenCalled()
    })
  })

  describe('discardBackup', () => {
    it('calls clearBackup with contentStore id', () => {
      mockContentStore.id = 42

      const { discardBackup } = useRecovery()
      discardBackup()

      expect(localStore.clearBackup).toHaveBeenCalledWith(42)
    })

    it('closes modal and clears recoveryData', () => {
      const design = createTestDesignDocument()
      localStore.loadBackup.mockReturnValue({
        design,
        meta: { savedAt: '2026-01-02T00:00:00Z', widgetCount: 0 },
      })
      localStore.hasNewerBackup.mockReturnValue(true)

      const { checkForRecovery, discardBackup, showRecoveryModal, recoveryData } = useRecovery()
      checkForRecovery(1, null)
      discardBackup()

      expect(showRecoveryModal.value).toBe(false)
      expect(recoveryData.value).toBeNull()
    })
  })
})
