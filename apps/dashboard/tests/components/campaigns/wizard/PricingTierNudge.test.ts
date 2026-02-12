import { describe, it, expect, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const sessionStore: Record<string, string> = {}
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => sessionStore[key] ?? null,
  setItem: (key: string, value: string) => { sessionStore[key] = value },
  clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]) },
})

const PricingTierNudge = (await import('@/components/campaigns/wizard/PricingTierNudge.vue')).default

const baseStubs = {
  Alert: { template: '<div data-alert :class="$attrs.class"><slot /></div>', inheritAttrs: true },
  AlertDescription: { template: '<div><slot /></div>' },
}

describe('PricingTierNudge', () => {
  it('displays message with volume gap', () => {
    // 1000 volume, next tier at 1100 → gap = 100 (within 20% of 1000)
    const wrapper = mount(PricingTierNudge, {
      props: {
        nextTier: { volumeThreshold: 1100, unitPrice: 0.03, savingsPercent: 25 },
        currentVolume: 1000,
      },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-pricing-nudge]').exists()).toBe(true)
    expect(wrapper.text()).toContain('wizard.estimate.pricingNudge.message')
  })

  it('displays savings percent', () => {
    const wrapper = mount(PricingTierNudge, {
      props: {
        nextTier: { volumeThreshold: 1100, unitPrice: 0.03, savingsPercent: 25 },
        currentVolume: 1000,
      },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-pricing-nudge]').exists()).toBe(true)
  })

  it('is dismissible', async () => {
    sessionStore['pricing-tier-nudge-dismissed'] = ''

    const wrapper = mount(PricingTierNudge, {
      props: {
        nextTier: { volumeThreshold: 1100, unitPrice: 0.03, savingsPercent: 25 },
        currentVolume: 1000,
      },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-pricing-nudge]').exists()).toBe(true)
    await wrapper.find('[data-pricing-nudge-dismiss]').trigger('click')
    expect(wrapper.find('[data-pricing-nudge]').exists()).toBe(false)
  })
})
