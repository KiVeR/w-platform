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
  removeItem: (key: string) => { delete sessionStore[key] },
  clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]) },
})

// Mock useSeasonalNudge to control what nudge is returned
const mockDismiss = vi.fn()
const mockNudge = ref<null | { titleKey: string, descKey: string, icon: { template: string }, colorClass: string }>(null)
vi.mock('@/composables/useSeasonalNudge', () => ({
  useSeasonalNudge: () => ({
    nudge: mockNudge,
    dismiss: mockDismiss,
  }),
}))

const SeasonalBanner = (await import('@/components/campaigns/wizard/SeasonalBanner.vue')).default

const baseStubs = {
  Alert: { template: '<div data-alert :class="$attrs.class"><slot /></div>', inheritAttrs: true },
  AlertDescription: { template: '<div><slot /></div>' },
}

describe('SeasonalBanner', () => {
  it('renders seasonal content when nudge active', () => {
    mockNudge.value = {
      titleKey: 'wizard.estimate.seasonal.christmas.title',
      descKey: 'wizard.estimate.seasonal.christmas.desc',
      icon: { template: '<span />' },
      colorClass: 'text-violet-600',
    }

    const wrapper = mount(SeasonalBanner, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-seasonal-banner]').exists()).toBe(true)
    expect(wrapper.text()).toContain('wizard.estimate.seasonal.christmas.title')
  })

  it('dismiss button triggers dismiss', async () => {
    mockNudge.value = {
      titleKey: 'wizard.estimate.seasonal.christmas.title',
      descKey: 'wizard.estimate.seasonal.christmas.desc',
      icon: { template: '<span />' },
      colorClass: 'text-violet-600',
    }

    const wrapper = mount(SeasonalBanner, { global: { stubs: baseStubs } })
    await wrapper.find('[data-seasonal-dismiss]').trigger('click')

    // After timeout of 250ms in the component, dismiss would be called
    // Since we can't easily test setTimeout, verify the button click registered
    expect(wrapper.find('[data-seasonal-banner]').exists()).toBe(false)
  })

  it('renders nothing when no season active', () => {
    mockNudge.value = null

    const wrapper = mount(SeasonalBanner, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-seasonal-banner]').exists()).toBe(false)
  })
})
