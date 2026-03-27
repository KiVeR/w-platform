import { beforeEach, describe, expect, test, vi } from 'vitest'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockGet = vi.fn()
const mockPut = vi.fn()
const mockPost = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, PUT: mockPut, POST: mockPost } })
})

const { usePartnerDetail } = await import('@/composables/usePartnerDetail')

function fakePartnerResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      data: {
        id: 42,
        name: 'Test Partner',
        code: 'TP-001',
        activity_type: 'boulangerie',
        email: 'test@test.fr',
        phone: '0600000000',
        address: '1 rue de la Paix',
        city: 'Paris',
        zip_code: '75001',
        euro_credits: '1500.50',
        is_active: true,
        router_id: 1,
        billing_mode: 'prepaid',
        adv_id: null,
        created_at: '2026-01-15T10:00:00Z',
        users_count: 3,
        shops_count: 2,
        ...overrides,
      },
    },
    error: undefined,
  }
}

describe('usePartnerDetail', () => {
  test('fetchPartner loads and maps data correctly', async () => {
    mockGet.mockResolvedValue(fakePartnerResponse())

    const { partner, fetchPartner, isLoading, hasError } = usePartnerDetail()
    await fetchPartner(42)

    expect(isLoading.value).toBe(false)
    expect(hasError.value).toBe(false)
    expect(partner.value).not.toBeNull()
    expect(partner.value!.id).toBe(42)
    expect(partner.value!.name).toBe('Test Partner')
    expect(partner.value!.euro_credits).toBeCloseTo(1500.50)
    expect(partner.value!.is_active).toBe(true)
    expect(partner.value!.code).toBe('TP-001')
  })

  test('fetchPartner sets hasError on API error', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, fetchPartner } = usePartnerDetail()
    await fetchPartner(42)

    expect(hasError.value).toBe(true)
  })

  test('fetchPartner parses euro_credits from string', async () => {
    mockGet.mockResolvedValue(fakePartnerResponse({ euro_credits: '999.99' }))

    const { partner, fetchPartner } = usePartnerDetail()
    await fetchPartner(42)

    expect(partner.value!.euro_credits).toBeCloseTo(999.99)
  })

  test('updatePartner calls PUT and returns true on success', async () => {
    mockGet.mockResolvedValue(fakePartnerResponse())
    mockPut.mockResolvedValue({ data: {}, error: undefined })

    const { updatePartner } = usePartnerDetail()
    const result = await updatePartner(42, { name: 'Updated Name' })

    expect(result).toBe(true)
    expect(mockPut).toHaveBeenCalledWith('/partners/{partner}', expect.objectContaining({
      params: { path: { partner: 42 } },
      body: { name: 'Updated Name' },
    }))
  })

  test('updatePartner returns false on error', async () => {
    mockPut.mockResolvedValue({ data: undefined, error: { status: 422 } })

    const { updatePartner, saveError } = usePartnerDetail()
    const result = await updatePartner(42, { name: '' })

    expect(result).toBe(false)
    expect(saveError.value).toBe('update_failed')
  })

  test('createPartner calls POST and returns new id', async () => {
    mockPost.mockResolvedValue({
      data: { data: { id: 99, name: 'New Partner' } },
      error: undefined,
    })

    const { createPartner } = usePartnerDetail()
    const id = await createPartner({ name: 'New Partner' })

    expect(id).toBe(99)
    expect(mockPost).toHaveBeenCalledWith('/partners', expect.objectContaining({
      body: { name: 'New Partner' },
    }))
  })

  test('createPartner returns null on error', async () => {
    mockPost.mockResolvedValue({ data: undefined, error: { status: 422 } })

    const { createPartner, saveError } = usePartnerDetail()
    const id = await createPartner({ name: '' })

    expect(id).toBeNull()
    expect(saveError.value).toBe('create_failed')
  })
})
