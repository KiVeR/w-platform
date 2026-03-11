import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeLogActivityList } from '../../helpers/fixtures'
import { useCampaignActivities } from '@/composables/useCampaignActivities'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet } })
  setActivePinia(createPinia())
})

describe('useCampaignActivities', () => {
  test('fetchActivities appelle GET et mappe la reponse', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeLogActivityList(3) },
      error: null,
    })

    const { activities, fetchActivities } = useCampaignActivities(42)
    await fetchActivities()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/activities', {
      params: { path: { campaign: 42 } },
    })
    expect(activities.value).toHaveLength(3)
    expect(activities.value[0].id).toBe(3)
    expect(activities.value[0].event).toBe('deleted')
  })

  test('fetchActivities set hasError quand API retourne une erreur', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, fetchActivities } = useCampaignActivities(42)
    await fetchActivities()

    expect(hasError.value).toBe(true)
  })

  test('fetchActivities gere les exceptions reseau', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { hasError, fetchActivities } = useCampaignActivities(42)
    await fetchActivities()

    expect(hasError.value).toBe(true)
  })

  test('fetchActivities reset hasError sur appel suivant reussi', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakeLogActivityList(1) },
      error: null,
    })

    const { hasError, fetchActivities } = useCampaignActivities(42)
    await fetchActivities()
    expect(hasError.value).toBe(true)

    await fetchActivities()
    expect(hasError.value).toBe(false)
  })

  test('fetchActivities mappe correctement old_values et new_values', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: '1',
          event: 'updated',
          model_type: 'App\\Models\\Campaign',
          model_id: '42',
          old_values: { status: 'draft' },
          new_values: { status: 'scheduled' },
          created_at: '2026-02-05T09:00:00Z',
        }],
      },
      error: null,
    })

    const { activities, fetchActivities } = useCampaignActivities(42)
    await fetchActivities()

    expect(activities.value[0].old_values).toEqual({ status: 'draft' })
    expect(activities.value[0].new_values).toEqual({ status: 'scheduled' })
  })

  test('fetchActivities gere model_type et model_id nullable', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: '1',
          event: 'created',
          model_type: null,
          model_id: null,
          old_values: null,
          new_values: null,
          created_at: '2026-02-05T09:00:00Z',
        }],
      },
      error: null,
    })

    const { activities, fetchActivities } = useCampaignActivities(42)
    await fetchActivities()

    expect(activities.value[0].model_type).toBeNull()
    expect(activities.value[0].model_id).toBeNull()
  })
})
