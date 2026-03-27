import { beforeEach, describe, expect, test, vi } from 'vitest'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockGet = vi.fn()
const mockPost = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, POST: mockPost } })
})

const { usePartnerCredits } = await import('@/composables/usePartnerCredits')

describe('usePartnerCredits', () => {
  test('fetchBalance loads and parses euro_credits from string', async () => {
    mockGet.mockResolvedValue({
      data: { data: { partner_id: 42, euro_credits: '1500.50' } },
      error: undefined,
    })

    const { balance, fetchBalance, isLoadingBalance, hasError } = usePartnerCredits()
    await fetchBalance(42)

    expect(isLoadingBalance.value).toBe(false)
    expect(hasError.value).toBe(false)
    expect(balance.value).not.toBeNull()
    expect(balance.value!.partner_id).toBe(42)
    expect(balance.value!.euro_credits).toBeCloseTo(1500.50)
  })

  test('fetchBalance sets hasError on failure', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, fetchBalance } = usePartnerCredits()
    await fetchBalance(42)

    expect(hasError.value).toBe(true)
  })

  test('fetchTransactions maps data correctly', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { id: 1, type: 'credit', amount: '100.00', balance_after: '100.00', description: 'Initial', created_at: '2026-01-01T00:00:00Z' },
          { id: 2, type: 'debit', amount: '-50.00', balance_after: '50.00', description: 'Campaign', created_at: '2026-01-02T00:00:00Z' },
        ],
      },
      error: undefined,
    })

    const { transactions, fetchTransactions } = usePartnerCredits()
    await fetchTransactions(42)

    expect(transactions.value).toHaveLength(2)
    expect(transactions.value[0].amount).toBeCloseTo(100)
    expect(transactions.value[1].amount).toBeCloseTo(-50)
    expect(transactions.value[0].description).toBe('Initial')
  })

  test('rechargeCredits calls POST and refreshes data', async () => {
    mockPost.mockResolvedValue({ data: {}, error: undefined })
    mockGet.mockResolvedValue({
      data: { data: { partner_id: 42, euro_credits: '250.00' } },
      error: undefined,
    })

    const { rechargeCredits, isRecharging, rechargeError } = usePartnerCredits()
    const success = await rechargeCredits(42, 250, 'Recharge test')

    expect(success).toBe(true)
    expect(isRecharging.value).toBe(false)
    expect(rechargeError.value).toBeNull()
    expect(mockPost).toHaveBeenCalledWith('/partners/{partner}/credits', expect.objectContaining({
      params: { path: { partner: 42 } },
      body: { amount: 250, description: 'Recharge test' },
    }))
  })

  test('rechargeCredits returns false on error', async () => {
    mockPost.mockResolvedValue({ data: undefined, error: { status: 422 } })

    const { rechargeCredits, rechargeError } = usePartnerCredits()
    const success = await rechargeCredits(42, 0, '')

    expect(success).toBe(false)
    expect(rechargeError.value).toBe('recharge_failed')
  })
})
