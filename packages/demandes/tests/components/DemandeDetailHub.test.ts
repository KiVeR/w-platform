import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../helpers/stubs'
import DemandeDetailHub from '../../components/DemandeDetailHub.vue'
import type { DemandeDetail, DemandeOperationRow } from '../../types/demandes'

function makeOp(overrides: Partial<DemandeOperationRow> = {}): DemandeOperationRow {
  return {
    id: 1,
    ref_operation: 'OP-001',
    line_number: 1,
    type: 'prospection',
    name: 'First Operation',
    advertiser: null,
    priority: null,
    lifecycle_status: 'draft',
    last_transitioned_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeDetail(overrides: Partial<DemandeDetail> = {}): DemandeDetail {
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
    operations_count: 0,
    operations_completed_count: 0,
    operations_blocked_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    partner: { id: 10, name: 'Acme Corp' },
    commercial: null,
    sdr: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockUseI18n()
  vi.stubGlobal('computed', computed)
})

describe('DemandeDetailHub', () => {
  it('shows header with total count', () => {
    const wrapper = mount(DemandeDetailHub, {
      props: { demande: makeDetail({ operations_count: 5, operations: [] }) },
    })

    expect(wrapper.find('[data-testid="total-count"]').text()).toContain('5')
  })

  it('shows progress counter as completed/total', () => {
    const wrapper = mount(DemandeDetailHub, {
      props: { demande: makeDetail({ operations_count: 8, operations_completed_count: 3, operations: [] }) },
    })

    expect(wrapper.find('[data-testid="progress-counter"]').text()).toBe('3/8')
  })

  it('shows empty state when no operations', () => {
    const wrapper = mount(DemandeDetailHub, {
      props: { demande: makeDetail({ operations: [] }) },
    })

    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="operations-list"]').exists()).toBe(false)
  })

  it('renders operation list when operations present', () => {
    const operations = [
      makeOp({ id: 1, line_number: 1 }),
      makeOp({ id: 2, line_number: 2, ref_operation: 'OP-002', name: 'Second Op' }),
    ]
    const wrapper = mount(DemandeDetailHub, {
      props: { demande: makeDetail({ operations, operations_count: 2 }) },
    })

    expect(wrapper.find('[data-testid="operations-list"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid^="operation-row-"]')).toHaveLength(2)
  })

  it('sorts operations by line_number ascending', () => {
    const operations = [
      makeOp({ id: 3, line_number: 3, ref_operation: 'OP-003' }),
      makeOp({ id: 1, line_number: 1, ref_operation: 'OP-001' }),
      makeOp({ id: 2, line_number: 2, ref_operation: 'OP-002' }),
    ]
    const wrapper = mount(DemandeDetailHub, {
      props: { demande: makeDetail({ operations }) },
    })

    const refs = wrapper.findAll('[data-testid="op-ref"]').map(el => el.text())
    expect(refs).toEqual(['OP-001', 'OP-002', 'OP-003'])
  })

  it('applies correct badge class for lifecycle_status', () => {
    const operations = [
      makeOp({ id: 1, lifecycle_status: 'completed' }),
    ]
    const wrapper = mount(DemandeDetailHub, {
      props: { demande: makeDetail({ operations }) },
    })

    const badge = wrapper.find('[data-testid="op-status"]')
    expect(badge.classes()).toContain('bg-green-100')
    expect(badge.classes()).toContain('text-green-800')
  })

  it('renders quick-create slot content', () => {
    const wrapper = mount(DemandeDetailHub, {
      props: { demande: makeDetail({ operations: [] }) },
      slots: {
        'quick-create': '<button data-testid="add-op-btn">Ajouter</button>',
      },
    })

    expect(wrapper.find('[data-testid="add-op-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="add-op-btn"]').text()).toBe('Ajouter')
  })
})
