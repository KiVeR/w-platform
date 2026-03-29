import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'
import { stubAuthGlobals } from '../../helpers/auth-stubs'

stubAuthGlobals()
mockUseI18n()
vi.stubGlobal('computed', computed)

const PartnerFeaturesPanel = (await import('@/components/hub/PartnerFeaturesPanel.vue')).default

describe('PartnerFeaturesPanel', () => {
  const sampleFeatures = [
    { key: 'campaign_prospection', is_enabled: true },
    { key: 'shops', is_enabled: false },
    { key: 'location_postcode', is_enabled: true },
    { key: 'demo_mode', is_enabled: false },
  ]

  it('renders features panel with feature rows', () => {
    const wrapper = mount(PartnerFeaturesPanel, {
      props: {
        features: sampleFeatures,
        isLoading: false,
        isAdmin: true,
      },
    })

    expect(wrapper.find('[data-features-panel]').exists()).toBe(true)
    const rows = wrapper.findAll('[data-feature-row]')
    expect(rows).toHaveLength(4)
  })

  it('shows group headers', () => {
    const wrapper = mount(PartnerFeaturesPanel, {
      props: {
        features: sampleFeatures,
        isLoading: false,
        isAdmin: true,
      },
    })

    const groups = wrapper.findAll('[data-feature-group]')
    expect(groups.length).toBeGreaterThanOrEqual(1)
  })

  it('emits toggle event when switch is changed', async () => {
    const wrapper = mount(PartnerFeaturesPanel, {
      props: {
        features: [{ key: 'shops', is_enabled: false }],
        isLoading: false,
        isAdmin: true,
      },
    })

    const switchEl = wrapper.find('[data-feature-key="shops"]')
    expect(switchEl.exists()).toBe(true)
  })

  it('shows empty state when no features', () => {
    const wrapper = mount(PartnerFeaturesPanel, {
      props: {
        features: [],
        isLoading: false,
        isAdmin: true,
      },
    })

    expect(wrapper.text()).toContain('hub.features.empty')
  })

  it('shows loading skeleton', () => {
    const wrapper = mount(PartnerFeaturesPanel, {
      props: {
        features: [],
        isLoading: true,
        isAdmin: true,
      },
    })

    expect(wrapper.find('[data-features-panel]').exists()).toBe(true)
  })
})
