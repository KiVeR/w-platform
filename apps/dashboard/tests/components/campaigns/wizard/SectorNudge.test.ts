import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import { localStorageMock } from '../../../helpers/auth-stubs'

vi.stubGlobal('ref', ref)
vi.stubGlobal('localStorage', localStorageMock)
mockUseI18n()

const SectorNudge = (await import('@/components/campaigns/wizard/SectorNudge.vue')).default

const baseStubs = {
  Alert: { template: '<div data-alert><slot /></div>' },
  AlertDescription: { template: '<div><slot /></div>' },
}

const sampleNudges = [
  { type: 'radius' as const, messageKey: 'wizard.estimate.sectorNudge.radiusTooLarge', messageParams: { recommended: '5-10', current: 50 } },
  { type: 'age' as const, messageKey: 'wizard.estimate.sectorNudge.ageRange', messageParams: { recommended: '40-75' } },
]

describe('SectorNudge', () => {
  it('renders nudge cards', () => {
    const wrapper = mount(SectorNudge, {
      props: { nudges: sampleNudges },
      global: { stubs: baseStubs },
    })
    expect(wrapper.findAll('[data-sector-nudge-card]').length).toBe(2)
  })

  it('renders nothing when empty array', () => {
    const wrapper = mount(SectorNudge, {
      props: { nudges: [] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-sector-nudges]').exists()).toBe(false)
  })

  it('dismiss hides the nudge', async () => {
    localStorageMock.clear()
    const wrapper = mount(SectorNudge, {
      props: { nudges: [sampleNudges[0]] },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-sector-nudge-card]').exists()).toBe(true)
    await wrapper.find('[data-sector-nudge-dismiss]').trigger('click')
    expect(wrapper.find('[data-sector-nudge-card]').exists()).toBe(false)
  })

  it('"Appliquer" emits apply event', async () => {
    localStorageMock.clear()
    const wrapper = mount(SectorNudge, {
      props: { nudges: [sampleNudges[0]] },
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-sector-nudge-apply]').trigger('click')
    expect(wrapper.emitted('apply')).toBeTruthy()
    expect(wrapper.emitted('apply')![0][0]).toMatchObject({ type: 'radius' })
  })
})
