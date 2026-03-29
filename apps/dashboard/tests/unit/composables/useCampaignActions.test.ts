import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { useCampaignActions } from '@/composables/useCampaignActions'

const mockPost = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { POST: mockPost } })
  setActivePinia(createPinia())
})

describe('useCampaignActions', () => {
  test('cancelCampaign appelle POST et retourne true', async () => {
    mockPost.mockResolvedValue({ data: {}, error: null })

    const { cancelCampaign, cancelError } = useCampaignActions(42)
    const result = await cancelCampaign()

    expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/cancel', {
      params: { path: { campaign: 42 } },
    })
    expect(result).toBe(true)
    expect(cancelError.value).toBeNull()
  })

  test('cancelCampaign retourne false si l API echoue', async () => {
    mockPost.mockResolvedValue({ data: null, error: { status: 422 } })

    const { cancelCampaign, cancelError } = useCampaignActions(42)
    const result = await cancelCampaign()

    expect(result).toBe(false)
    expect(cancelError.value).toBe('cancel_error')
  })

  test('cancelCampaign gere les erreurs reseau', async () => {
    mockPost.mockRejectedValue(new Error('Network error'))

    const { cancelCampaign, cancelError } = useCampaignActions(42)
    const result = await cancelCampaign()

    expect(result).toBe(false)
    expect(cancelError.value).toBe('cancel_error')
  })

  test('cancelCampaign reset l erreur apres un appel reussi', async () => {
    mockPost.mockResolvedValueOnce({ data: null, error: { status: 422 } })
    mockPost.mockResolvedValueOnce({ data: {}, error: null })

    const { cancelCampaign, cancelError } = useCampaignActions(42)

    await cancelCampaign()
    expect(cancelError.value).toBe('cancel_error')

    await cancelCampaign()
    expect(cancelError.value).toBeNull()
  })

  test('startRouting appelle POST routing/start et retourne true', async () => {
    mockPost.mockResolvedValue({ data: {}, error: null })

    const { startRouting, routingActionError } = useCampaignActions(42)
    const result = await startRouting()

    expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/routing/start', {
      params: { path: { campaign: 42 } },
    })
    expect(result).toBe(true)
    expect(routingActionError.value).toBeNull()
  })

  test('pauseRouting appelle POST routing/pause et retourne true', async () => {
    mockPost.mockResolvedValue({ data: {}, error: null })

    const { pauseRouting, routingActionError } = useCampaignActions(42)
    const result = await pauseRouting()

    expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/routing/pause', {
      params: { path: { campaign: 42 } },
    })
    expect(result).toBe(true)
    expect(routingActionError.value).toBeNull()
  })

  test('cancelRouting appelle POST routing/cancel et retourne true', async () => {
    mockPost.mockResolvedValue({ data: {}, error: null })

    const { cancelRouting, routingActionError } = useCampaignActions(42)
    const result = await cancelRouting()

    expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/routing/cancel', {
      params: { path: { campaign: 42 } },
    })
    expect(result).toBe(true)
    expect(routingActionError.value).toBeNull()
  })

  test('pullReport appelle POST pull-report et retourne true', async () => {
    mockPost.mockResolvedValue({ data: {}, error: null })

    const { pullReport, routingActionError } = useCampaignActions(42)
    const result = await pullReport()

    expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/pull-report', {
      params: { path: { campaign: 42 } },
    })
    expect(result).toBe(true)
    expect(routingActionError.value).toBeNull()
  })

  test('startRouting retourne false si API echoue', async () => {
    mockPost.mockResolvedValue({ data: null, error: { status: 409 } })

    const { startRouting, routingActionError } = useCampaignActions(42)
    const result = await startRouting()

    expect(result).toBe(false)
    expect(routingActionError.value).toBe('routing_error')
  })
})
