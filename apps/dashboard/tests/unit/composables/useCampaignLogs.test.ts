import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeCampaignLogList } from '../../helpers/fixtures'
import { useCampaignLogs } from '@/composables/useCampaignLogs'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet } })
  setActivePinia(createPinia())
})

describe('useCampaignLogs', () => {
  test('fetchLogs appelle GET et mappe la reponse', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeCampaignLogList(2) },
      error: null,
    })

    const { logs, fetchLogs } = useCampaignLogs(42)
    await fetchLogs()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/logs', {
      params: { path: { campaign: 42 } },
    })
    expect(logs.value).toHaveLength(2)
    expect(logs.value[0].id).toBe(1)
    expect(logs.value[0].campaign_id).toBe(42)
  })

  test('fetchLogs set hasError quand API retourne une erreur', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, fetchLogs } = useCampaignLogs(42)
    await fetchLogs()

    expect(hasError.value).toBe(true)
  })

  test('fetchLogs gere les exceptions reseau', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { hasError, fetchLogs } = useCampaignLogs(42)
    await fetchLogs()

    expect(hasError.value).toBe(true)
  })

  test('fetchLogs reset hasError sur appel suivant reussi', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakeCampaignLogList(1) },
      error: null,
    })

    const { hasError, fetchLogs } = useCampaignLogs(42)
    await fetchLogs()
    expect(hasError.value).toBe(true)

    await fetchLogs()
    expect(hasError.value).toBe(false)
  })

  test('fetchLogs conserve le blob data JSONB intact', async () => {
    mockGet.mockResolvedValue({
      data: { data: [{ id: '1', campaign_id: '42', data: { nested: { ok: true } }, created_at: '2026-02-05T09:00:00Z' }] },
      error: null,
    })

    const { logs, fetchLogs } = useCampaignLogs(42)
    await fetchLogs()

    expect(logs.value[0].data).toEqual({ nested: { ok: true } })
  })
})
