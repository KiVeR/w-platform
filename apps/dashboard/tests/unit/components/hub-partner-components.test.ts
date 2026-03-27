import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'
import { stubAuthGlobals } from '../../helpers/auth-stubs'

stubAuthGlobals()
mockUseI18n()
vi.stubGlobal('computed', computed)

const PartnerStatusBadge = (await import('@/components/hub/PartnerStatusBadge.vue')).default
const PartnerCreditsCell = (await import('@/components/hub/PartnerCreditsCell.vue')).default

describe('PartnerStatusBadge', () => {
  it('renders active badge with success classes', () => {
    const wrapper = mount(PartnerStatusBadge, {
      props: { isActive: true },
    })

    const badge = wrapper.find('[data-partner-status-badge]')
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toContain('bg-success-100')
    expect(badge.text()).toBe('hub.partners.status.active')
  })

  it('renders inactive badge with error classes', () => {
    const wrapper = mount(PartnerStatusBadge, {
      props: { isActive: false },
    })

    const badge = wrapper.find('[data-partner-status-badge]')
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toContain('bg-error-100')
    expect(badge.text()).toBe('hub.partners.status.inactive')
  })
})

describe('PartnerCreditsCell', () => {
  it('renders green text for credits > 1000', () => {
    const wrapper = mount(PartnerCreditsCell, {
      props: { credits: 1500.50 },
    })

    const cell = wrapper.find('[data-partner-credits-cell]')
    expect(cell.exists()).toBe(true)
    expect(cell.classes()).toContain('text-success-700')
    expect(cell.text()).toBe('1500.50 EUR')
  })

  it('renders orange text for credits between 200-1000', () => {
    const wrapper = mount(PartnerCreditsCell, {
      props: { credits: 500 },
    })

    const cell = wrapper.find('[data-partner-credits-cell]')
    expect(cell.classes()).toContain('text-warning-700')
    expect(cell.text()).toBe('500.00 EUR')
  })

  it('renders red text for credits < 200', () => {
    const wrapper = mount(PartnerCreditsCell, {
      props: { credits: 99.50 },
    })

    const cell = wrapper.find('[data-partner-credits-cell]')
    expect(cell.classes()).toContain('text-error-700')
    expect(cell.text()).toBe('99.50 EUR')
  })

  it('renders exactly 200 as orange (boundary)', () => {
    const wrapper = mount(PartnerCreditsCell, {
      props: { credits: 200 },
    })

    const cell = wrapper.find('[data-partner-credits-cell]')
    expect(cell.classes()).toContain('text-warning-700')
  })

  it('renders zero credits in red', () => {
    const wrapper = mount(PartnerCreditsCell, {
      props: { credits: 0 },
    })

    const cell = wrapper.find('[data-partner-credits-cell]')
    expect(cell.classes()).toContain('text-error-700')
    expect(cell.text()).toBe('0.00 EUR')
  })
})
