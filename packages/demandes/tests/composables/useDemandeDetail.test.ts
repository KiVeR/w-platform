import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtApp } from '../helpers/stubs'
import { useDemandeDetail } from '../../composables/useDemandeDetail'

function makeRawDemandeDetail(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 42,
    ref_demande: 'DEM-042',
    ref_client: 'CLI-001',
    information: 'Some info',
    is_exoneration: false,
    pays_id: 'FR',
    partner_id: 10,
    commercial_id: 5,
    sdr_id: 6,
    operations_count: 3,
    operations_completed_count: 2,
    operations_blocked_count: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    partner: { id: 10, name: 'Acme Corp' },
    commercial: { id: 5, full_name: 'Alice Dupont' },
    sdr: { id: 6, full_name: 'Bob Martin' },
    operations: [
      {
        id: 100,
        ref_operation: 'OP-100',
        line_number: 1,
        type: 'print',
        name: 'Op one',
        advertiser: 'Brand A',
        priority: 'high',
        lifecycle_status: 'in_progress',
        last_transitioned_at: '2026-01-05T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useDemandeDetail', () => {
  it('fetches demande detail when id is provided', async () => {
    const rawDetail = makeRawDemandeDetail()
    const GET = vi.fn().mockResolvedValue({ data: { data: rawDetail }, error: null })
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(42)
    // watch is immediate — we need to await the watcher
    const { demande } = useDemandeDetail(demandeId)
    await vi.waitUntil(() => demande.value !== null)

    expect(demande.value).not.toBeNull()
    expect(demande.value!.id).toBe(42)
    expect(demande.value!.ref_demande).toBe('DEM-042')
  })

  it('includes partner, commercial, sdr, operations in query', async () => {
    const GET = vi.fn().mockResolvedValue({ data: { data: makeRawDemandeDetail() }, error: null })
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(42)
    useDemandeDetail(demandeId)
    await vi.waitUntil(() => GET.mock.calls.length > 0)

    const callArgs = GET.mock.calls[0][1]
    expect(callArgs.params.query.include).toBe('partner,commercial,sdr,operations')
  })

  it('handles API errors gracefully', async () => {
    const GET = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(42)
    const { hasError, isLoading } = useDemandeDetail(demandeId)
    await vi.waitUntil(() => GET.mock.calls.length > 0)
    // give it a tick to process
    await new Promise(r => setTimeout(r, 10))

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('does not fetch when id is null', async () => {
    const GET = vi.fn()
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(null)
    useDemandeDetail(demandeId)
    // small delay to ensure any async call would have happened
    await new Promise(r => setTimeout(r, 10))

    expect(GET).not.toHaveBeenCalled()
  })

  it('exposes refreshDemande that re-fetches', async () => {
    const GET = vi.fn().mockResolvedValue({ data: { data: makeRawDemandeDetail() }, error: null })
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(42)
    const { refreshDemande } = useDemandeDetail(demandeId)
    await vi.waitUntil(() => GET.mock.calls.length > 0)

    await refreshDemande()
    expect(GET).toHaveBeenCalledTimes(2)
  })

  it('watches demandeId changes and refetches', async () => {
    const GET = vi.fn().mockResolvedValue({ data: { data: makeRawDemandeDetail() }, error: null })
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(42)
    useDemandeDetail(demandeId)
    await vi.waitUntil(() => GET.mock.calls.length === 1)

    demandeId.value = 99
    await vi.waitUntil(() => GET.mock.calls.length === 2)

    const secondCallPath = GET.mock.calls[1][1].params.path.id
    expect(secondCallPath).toBe(99)
  })

  it('maps operations to DemandeOperationRow', async () => {
    const GET = vi.fn().mockResolvedValue({ data: { data: makeRawDemandeDetail() }, error: null })
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(42)
    const { demande } = useDemandeDetail(demandeId)
    await vi.waitUntil(() => demande.value !== null)

    const ops = demande.value!.operations!
    expect(ops).toHaveLength(1)
    expect(ops[0].id).toBe(100)
    expect(ops[0].ref_operation).toBe('OP-100')
    expect(ops[0].lifecycle_status).toBe('in_progress')
    expect(ops[0].advertiser).toBe('Brand A')
  })

  it('maps commercial and sdr user relations', async () => {
    const GET = vi.fn().mockResolvedValue({ data: { data: makeRawDemandeDetail() }, error: null })
    mockNuxtApp({ GET })

    const demandeId = ref<number | null>(42)
    const { demande } = useDemandeDetail(demandeId)
    await vi.waitUntil(() => demande.value !== null)

    expect(demande.value!.commercial).toEqual({ id: 5, full_name: 'Alice Dupont' })
    expect(demande.value!.sdr).toEqual({ id: 6, full_name: 'Bob Martin' })
  })
})
