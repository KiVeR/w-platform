import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtApp } from '../helpers/stubs'
import { useOperationTransitions } from '#operations/composables/useOperationTransitions'

const mockGet = vi.fn()
const mockPost = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockNuxtApp({ GET: mockGet, POST: mockPost })
})

describe('useOperationTransitions', () => {
  it('applyTransition posts to API and returns true on success', async () => {
    mockPost.mockResolvedValue({ data: { success: true }, error: undefined })

    const { applyTransition, isTransitioning } = useOperationTransitions()
    const result = await applyTransition(1, 'lifecycle', 'preparing', 'Starting prep')

    expect(result).toBe(true)
    expect(isTransitioning.value).toBe(false)
    expect(mockPost).toHaveBeenCalledWith('/operations/{operation}/transition', {
      params: { path: { operation: 1 } },
      body: { track: 'lifecycle', to_state: 'preparing', reason: 'Starting prep' },
    })
  })

  it('applyTransition returns false on API error', async () => {
    mockPost.mockResolvedValue({ data: undefined, error: { status: 422 } })

    const { applyTransition, hasError } = useOperationTransitions()
    const result = await applyTransition(1, 'lifecycle', 'preparing')

    expect(result).toBe(false)
    expect(hasError.value).toBe(true)
  })

  it('fetchTransitionHistory loads transitions from API', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            operation_id: 1,
            track: 'lifecycle',
            from_state: 'draft',
            to_state: 'preparing',
            user_id: 5,
            reason: null,
            metadata: null,
            created_at: '2026-03-01T10:00:00Z',
            user: { id: 5, full_name: 'John Doe' },
          },
        ],
      },
    })

    const { transitions, fetchTransitionHistory } = useOperationTransitions()
    await fetchTransitionHistory(1)

    expect(transitions.value).toHaveLength(1)
    expect(transitions.value[0].from_state).toBe('draft')
    expect(transitions.value[0].to_state).toBe('preparing')
    expect(transitions.value[0].user?.full_name).toBe('John Doe')
  })
})
