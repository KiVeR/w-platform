import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../helpers/stubs'

mockUseI18n()

const PartnerBalanceCard = (await import('#billing/components/PartnerBalanceCard.vue')).default

describe('PartnerBalanceCard', () => {
  it('renders balance amount with green color for positive values', () => {
    const wrapper = mount(PartnerBalanceCard, {
      props: { euroCredits: 1500.50, isLoading: false },
    })
    const amount = wrapper.find('[data-testid="balance-amount"]')
    expect(amount.exists()).toBe(true)
    expect(amount.classes()).toContain('text-green-600')
    // Intl.NumberFormat for fr-FR uses narrow non-breaking space
    expect(amount.text()).toContain('1')
    expect(amount.text()).toContain('500')
  })

  it('renders balance with red color for zero or negative values', () => {
    const wrapper = mount(PartnerBalanceCard, {
      props: { euroCredits: 0, isLoading: false },
    })
    const amount = wrapper.find('[data-testid="balance-amount"]')
    expect(amount.exists()).toBe(true)
    expect(amount.classes()).toContain('text-red-600')
  })

  it('shows loading state when isLoading is true', () => {
    const wrapper = mount(PartnerBalanceCard, {
      props: { euroCredits: 0, isLoading: true },
    })
    expect(wrapper.find('[data-testid="balance-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="balance-amount"]').exists()).toBe(false)
  })
})
