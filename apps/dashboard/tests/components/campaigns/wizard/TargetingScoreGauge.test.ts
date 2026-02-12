import { describe, it, expect, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const TargetingScoreGauge = (await import('@/components/campaigns/wizard/TargetingScoreGauge.vue')).default

describe('TargetingScoreGauge', () => {
  it('renders correct level/color for optimal volume', () => {
    const wrapper = mount(TargetingScoreGauge, {
      props: { volume: 5000 },
    })
    const label = wrapper.find('[data-gauge-label]')
    expect(label.text()).toContain('wizard.estimate.score.optimal')
    expect(label.classes()).toContain('text-success')
  })

  it('has ARIA attributes', () => {
    const wrapper = mount(TargetingScoreGauge, {
      props: { volume: 5000 },
    })
    const gauge = wrapper.find('[data-targeting-gauge]')
    expect(gauge.attributes('role')).toBe('meter')
    expect(gauge.attributes('aria-valuenow')).toBe('5000')
    expect(gauge.attributes('aria-live')).toBe('polite')
  })
})
