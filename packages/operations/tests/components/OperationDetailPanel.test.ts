import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../helpers/stubs'

mockUseI18n()

const OperationDetailPanel = (await import('#operations/components/OperationDetailPanel.vue')).default

const fakeDetail = {
  id: 1,
  demande_id: 10,
  ref_operation: 'OP-001',
  line_number: 1,
  type: 'loc' as const,
  name: 'Campaign Alpha',
  advertiser: 'Acme Corp',
  priority: 'high' as const,
  lifecycle_status: 'preparing' as const,
  creative_status: 'not_applicable' as const,
  billing_status: 'not_applicable' as const,
  routing_status: 'not_applicable' as const,
  volume_estimated: 5000,
  volume_sent: null,
  unit_price: 0.05,
  total_price: 250,
  assigned_to: 5,
  scheduled_at: null,
  delivered_at: null,
  created_at: '2026-03-01T10:00:00Z',
  hold_reason: null,
  preparation_step: null,
  processing_status: null,
  cancellation_type: null,
  targeting: null,
  message: 'Hello world',
  sender: 'Wellpack',
  external_ref: null,
  demande: { id: 10, ref_demande: 'DEM-10', partner_id: 1, partner: { id: 1, name: 'Partner A' } },
  campaign: null,
  assigned_user: { id: 5, full_name: 'John Doe' },
}

const stubs = {
  OperationStatusBadge: {
    template: '<span data-stub="badge">{{ status }}</span>',
    props: ['status'],
  },
  OperationTransitionMenu: {
    template: '<div data-stub="transition-menu" />',
    props: ['currentStatus', 'operationId', 'isTransitioning'],
  },
  OperationTimeline: {
    template: '<div data-stub="timeline" />',
    props: ['transitions', 'isLoading'],
  },
}

describe('OperationDetailPanel', () => {
  it('renders operation name and ref', () => {
    const wrapper = mount(OperationDetailPanel, {
      props: {
        operation: fakeDetail,
        transitions: [],
        isLoadingTransitions: false,
        isTransitioning: false,
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Campaign Alpha')
    expect(wrapper.text()).toContain('OP-001')
  })

  it('shows summary tab by default with partner and assigned user', () => {
    const wrapper = mount(OperationDetailPanel, {
      props: {
        operation: fakeDetail,
        transitions: [],
        isLoadingTransitions: false,
        isTransitioning: false,
      },
      global: { stubs },
    })
    expect(wrapper.find('[data-testid="tab-summary"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Partner A')
    expect(wrapper.text()).toContain('John Doe')
  })

  it('switches to timeline tab on click', async () => {
    const wrapper = mount(OperationDetailPanel, {
      props: {
        operation: fakeDetail,
        transitions: [],
        isLoadingTransitions: false,
        isTransitioning: false,
      },
      global: { stubs },
    })
    await wrapper.find('[data-tab="timeline"]').trigger('click')
    expect(wrapper.find('[data-testid="tab-timeline"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-summary"]').exists()).toBe(false)
  })
})
