import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed } from 'vue'
import { mockUseI18n } from '../helpers/stubs'
import DemandeActionZone from '../../components/DemandeActionZone.vue'
import type { DemandeRow, DemandeOperationRow } from '../../types/demandes'

const NOW = new Date('2026-03-24T12:00:00.000Z').getTime()

function makeOperation(overrides: Partial<DemandeOperationRow> = {}): DemandeOperationRow {
  return {
    id: 1,
    ref_operation: 'OP-001',
    line_number: 1,
    type: 'prospect',
    name: 'Op 1',
    advertiser: null,
    priority: null,
    lifecycle_status: 'in_progress',
    last_transitioned_at: null,
    created_at: '2026-03-20T00:00:00.000Z',
    ...overrides,
  }
}

function makeDemandeRow(overrides: Partial<DemandeRow> = {}): DemandeRow {
  return {
    id: 1,
    ref_demande: 'DEM-001',
    ref_client: null,
    information: null,
    is_exoneration: false,
    pays_id: null,
    partner_id: 10,
    commercial_id: null,
    sdr_id: null,
    operations_count: 2,
    operations_completed_count: 1,
    operations_blocked_count: 0,
    created_at: '2026-03-23T00:00:00.000Z',
    updated_at: '2026-03-23T00:00:00.000Z',
    partner: { id: 10, name: 'Acme Corp' },
    operations: [],
    ...overrides,
  }
}

function setupActionableDemandes(demandes: DemandeRow[]) {
  const demandesRef = ref<DemandeRow[]>(demandes)
  const isLoadingRef = ref(false)
  const hasErrorRef = ref(false)
  const fetchActionableDemandes = vi.fn().mockImplementation(async () => {
    // already set
  })
  vi.stubGlobal('useActionableDemandes', () => ({
    demandes: demandesRef,
    isLoading: isLoadingRef,
    hasError: hasErrorRef,
    fetchActionableDemandes,
  }))
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.setSystemTime(NOW)
  mockUseI18n()
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', (fn: () => void) => fn())
})

describe('DemandeActionZone', () => {
  it('renders when blocked demandes exist', () => {
    const demande = makeDemandeRow({ operations_blocked_count: 2 })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.find('[data-testid="action-zone"]').exists()).toBe(true)
  })

  it('hides when no action required', () => {
    const demande = makeDemandeRow({
      operations_blocked_count: 0,
      operations_count: 2,
      // created_at > 3 days ago = not recent
      created_at: '2026-01-01T00:00:00.000Z',
      operations: [],
    })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.find('[data-testid="action-zone"]').exists()).toBe(false)
  })

  it('shows count in title', () => {
    const demandes = [
      makeDemandeRow({ id: 1, operations_blocked_count: 1 }),
      makeDemandeRow({ id: 2, operations_blocked_count: 2 }),
    ]
    setupActionableDemandes(demandes)

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.text()).toContain('(2)')
  })

  it('lists blocked demandes', () => {
    const demande = makeDemandeRow({ id: 1, ref_demande: 'DEM-999', operations_blocked_count: 1 })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.text()).toContain('DEM-999')
  })

  it('shows blocked badge with count', () => {
    const demande = makeDemandeRow({ operations_blocked_count: 3 })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    const badge = wrapper.find('[data-testid="badge-blocked"]')
    expect(badge.exists()).toBe(true)
    // i18n stub returns the key; verify the badge is rendered for a blocked demande
    expect(badge.text()).toContain('demandes.action_zone.operations_blocked')
  })

  it('shows no-operations badge for recent demandes', () => {
    // Recent: created 1 day ago, no operations
    const demande = makeDemandeRow({
      operations_count: 0,
      operations_completed_count: 0,
      operations_blocked_count: 0,
      created_at: '2026-03-23T12:00:00.000Z', // 1 day ago
    })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    const badge = wrapper.find('[data-testid="badge-no-ops"]')
    expect(badge.exists()).toBe(true)
  })

  it('excludes old demandes without operations', () => {
    // Old (> 3 days), no operations, no blocked — should NOT appear
    const demande = makeDemandeRow({
      operations_count: 0,
      operations_completed_count: 0,
      operations_blocked_count: 0,
      created_at: '2026-03-01T00:00:00.000Z', // > 3 days ago
    })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.find('[data-testid="action-zone"]').exists()).toBe(false)
  })

  it('emits select on click', async () => {
    const demande = makeDemandeRow({ id: 42, operations_blocked_count: 1 })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    const item = wrapper.find('[data-testid="action-item-42"]')
    expect(item.exists()).toBe(true)
    await item.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0][0]).toMatchObject({ id: 42 })
  })

  it('sorts by blocked count descending', () => {
    const demandes = [
      makeDemandeRow({ id: 1, ref_demande: 'DEM-001', operations_blocked_count: 1 }),
      makeDemandeRow({ id: 2, ref_demande: 'DEM-002', operations_blocked_count: 5 }),
      makeDemandeRow({ id: 3, ref_demande: 'DEM-003', operations_blocked_count: 3 }),
    ]
    setupActionableDemandes(demandes)

    const wrapper = mount(DemandeActionZone)
    const items = wrapper.findAll('li')
    expect(items[0].text()).toContain('DEM-002') // 5 blocked = first
    expect(items[1].text()).toContain('DEM-003') // 3 blocked = second
    expect(items[2].text()).toContain('DEM-001') // 1 blocked = third
  })

  it('renders demande ref', () => {
    const demande = makeDemandeRow({ ref_demande: 'DEM-XYZ', operations_blocked_count: 1 })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.text()).toContain('DEM-XYZ')
  })

  it('renders partner name', () => {
    const demande = makeDemandeRow({ operations_blocked_count: 1, partner: { id: 5, name: 'BrandX' } })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.text()).toContain('BrandX')
  })

  it('handles empty demandes array', () => {
    setupActionableDemandes([])

    const wrapper = mount(DemandeActionZone)
    expect(wrapper.find('[data-testid="action-zone"]').exists()).toBe(false)
    // no crash
  })

  it('shows stale badge for operations with last_transitioned_at > 7 days', () => {
    const staleOp = makeOperation({
      id: 10,
      lifecycle_status: 'in_progress',
      // 10 days ago
      last_transitioned_at: '2026-03-14T12:00:00.000Z',
    })
    const demande = makeDemandeRow({
      operations_blocked_count: 0,
      operations: [staleOp],
    })
    setupActionableDemandes([demande])

    const wrapper = mount(DemandeActionZone)
    const badge = wrapper.find('[data-testid="badge-stale"]')
    expect(badge.exists()).toBe(true)
  })
})
