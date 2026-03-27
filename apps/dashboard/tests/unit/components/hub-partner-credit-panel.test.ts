import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'
import { stubAuthGlobals } from '../../helpers/auth-stubs'

stubAuthGlobals()
mockUseI18n()
vi.stubGlobal('computed', computed)

const PartnerCreditPanel = (await import('@/components/hub/PartnerCreditPanel.vue')).default

describe('PartnerCreditPanel', () => {
  it('renders balance amount when loaded', () => {
    const wrapper = mount(PartnerCreditPanel, {
      props: {
        balance: { partner_id: 42, euro_credits: 1500.50 },
        transactions: [],
        isLoadingBalance: false,
        isLoadingTransactions: false,
        isAdmin: true,
      },
    })

    expect(wrapper.find('[data-credit-panel]').exists()).toBe(true)
    expect(wrapper.find('[data-balance-amount]').exists()).toBe(true)
    // Check formatted amount is displayed
    expect(wrapper.find('[data-balance-amount]').text()).toContain('1')
  })

  it('shows recharge button for admin', () => {
    const wrapper = mount(PartnerCreditPanel, {
      props: {
        balance: { partner_id: 42, euro_credits: 100 },
        transactions: [],
        isLoadingBalance: false,
        isLoadingTransactions: false,
        isAdmin: true,
      },
    })

    expect(wrapper.find('[data-recharge-btn]').exists()).toBe(true)
  })

  it('hides recharge button for non-admin', () => {
    const wrapper = mount(PartnerCreditPanel, {
      props: {
        balance: { partner_id: 42, euro_credits: 100 },
        transactions: [],
        isLoadingBalance: false,
        isLoadingTransactions: false,
        isAdmin: false,
      },
    })

    expect(wrapper.find('[data-recharge-btn]').exists()).toBe(false)
  })

  it('renders transaction rows', () => {
    const wrapper = mount(PartnerCreditPanel, {
      props: {
        balance: { partner_id: 42, euro_credits: 100 },
        transactions: [
          { id: 1, type: 'credit', amount: 100, balance_after: 100, description: 'Recharge', created_at: '2026-01-01T00:00:00Z' },
          { id: 2, type: 'debit', amount: -50, balance_after: 50, description: 'Campaign', created_at: '2026-01-02T00:00:00Z' },
        ],
        isLoadingBalance: false,
        isLoadingTransactions: false,
        isAdmin: true,
      },
    })

    const rows = wrapper.findAll('[data-transaction-row]')
    expect(rows).toHaveLength(2)
  })

  it('emits recharge event', async () => {
    const wrapper = mount(PartnerCreditPanel, {
      props: {
        balance: { partner_id: 42, euro_credits: 100 },
        transactions: [],
        isLoadingBalance: false,
        isLoadingTransactions: false,
        isAdmin: true,
      },
    })

    await wrapper.find('[data-recharge-btn]').trigger('click')
    expect(wrapper.emitted('recharge')).toBeTruthy()
  })

  it('emits refresh event', async () => {
    const wrapper = mount(PartnerCreditPanel, {
      props: {
        balance: { partner_id: 42, euro_credits: 100 },
        transactions: [],
        isLoadingBalance: false,
        isLoadingTransactions: false,
        isAdmin: true,
      },
    })

    await wrapper.find('[data-refresh-btn]').trigger('click')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('shows no transactions message when list is empty', () => {
    const wrapper = mount(PartnerCreditPanel, {
      props: {
        balance: { partner_id: 42, euro_credits: 0 },
        transactions: [],
        isLoadingBalance: false,
        isLoadingTransactions: false,
        isAdmin: true,
      },
    })

    expect(wrapper.text()).toContain('hub.credits.noTransactions')
  })
})
