import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../helpers/stubs'

mockUseI18n()

// Stub the child component
vi.stubGlobal('OperationStatusBadge', {
  template: '<span data-stub="badge">{{ status }}</span>',
  props: ['status'],
})

const OperationsDataTable = (await import('#operations/components/OperationsDataTable.vue')).default

const fakeOperations = [
  {
    id: 1,
    demande_id: 10,
    ref_operation: 'OP-001',
    line_number: 1,
    type: 'loc' as const,
    name: 'Campaign Alpha',
    advertiser: null,
    priority: null,
    lifecycle_status: 'draft' as const,
    creative_status: 'not_applicable' as const,
    billing_status: 'not_applicable' as const,
    routing_status: 'not_applicable' as const,
    volume_estimated: 1000,
    volume_sent: null,
    unit_price: null,
    total_price: null,
    assigned_to: null,
    scheduled_at: '2026-04-01T08:00:00Z',
    delivered_at: null,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 2,
    demande_id: 10,
    ref_operation: 'OP-002',
    line_number: 2,
    type: 'fid' as const,
    name: 'Campaign Beta',
    advertiser: null,
    priority: null,
    lifecycle_status: 'processing' as const,
    creative_status: 'not_applicable' as const,
    billing_status: 'not_applicable' as const,
    routing_status: 'not_applicable' as const,
    volume_estimated: 2000,
    volume_sent: null,
    unit_price: null,
    total_price: null,
    assigned_to: null,
    scheduled_at: null,
    delivered_at: null,
    created_at: '2026-03-02T10:00:00Z',
  },
]

describe('OperationsDataTable', () => {
  it('renders rows for each operation', () => {
    const wrapper = mount(OperationsDataTable, {
      props: { operations: fakeOperations, isLoading: false },
      global: {
        stubs: {
          OperationStatusBadge: {
            template: '<span data-stub="badge">{{ status }}</span>',
            props: ['status'],
          },
        },
      },
    })
    const rows = wrapper.findAll('[data-row-id]')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('OP-001')
    expect(rows[0].text()).toContain('Campaign Alpha')
  })

  it('emits select when row is clicked', async () => {
    const wrapper = mount(OperationsDataTable, {
      props: { operations: fakeOperations, isLoading: false },
      global: {
        stubs: {
          OperationStatusBadge: {
            template: '<span>{{ status }}</span>',
            props: ['status'],
          },
        },
      },
    })
    await wrapper.find('[data-row-id="1"]').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([1])
  })

  it('shows empty state when no operations', () => {
    const wrapper = mount(OperationsDataTable, {
      props: { operations: [], isLoading: false },
    })
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('shows loading state', () => {
    const wrapper = mount(OperationsDataTable, {
      props: { operations: [], isLoading: true },
    })
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
  })
})
