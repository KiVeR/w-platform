import { describe, it, expect, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { stubAuthGlobals } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'
import type { CampaignTargeting } from '@/types/campaign'

stubAuthGlobals()
vi.stubGlobal('computed', computed)
mockUseI18n()

const TargetingSummary = (await import('@/components/campaigns/TargetingSummary.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
}

const baseTargeting: CampaignTargeting = {
  method: 'department',
  departments: [],
  postcodes: [],
  address: null,
  lat: null,
  lng: null,
  radius: null,
  gender: null,
  age_min: null,
  age_max: null,
}

describe('TargetingSummary', () => {
  function mountComponent(targeting: CampaignTargeting) {
    return mount(TargetingSummary, {
      props: { targeting },
      global: { stubs: baseStubs },
    })
  }

  it('affiche la méthode département avec les codes', () => {
    const wrapper = mountComponent({
      ...baseTargeting,
      method: 'department',
      departments: ['75', '77', '92'],
    })
    const zones = wrapper.find('[data-zones]')
    expect(zones.exists()).toBe(true)
    expect(zones.text()).toBe('75, 77, 92')
  })

  it('affiche la méthode code postal avec les codes', () => {
    const wrapper = mountComponent({
      ...baseTargeting,
      method: 'postcode',
      postcodes: ['75001', '75002'],
    })
    const zones = wrapper.find('[data-zones]')
    expect(zones.exists()).toBe(true)
    expect(zones.text()).toBe('75001, 75002')
  })

  it('affiche la méthode adresse avec rayon', () => {
    const wrapper = mountComponent({
      ...baseTargeting,
      method: 'address',
      address: '10 rue de la Paix, Paris',
      lat: 48.868,
      lng: 2.331,
      radius: 5,
    })
    const zones = wrapper.find('[data-zones]')
    expect(zones.exists()).toBe(true)
    expect(zones.text()).toBe('10 rue de la Paix, Paris (5 km)')
  })

  it('affiche la démographie mixte tous âges par défaut', () => {
    const wrapper = mountComponent(baseTargeting)
    const demo = wrapper.find('[data-demographics]')
    expect(demo.text()).toContain('campaigns.detail.targeting.mixed')
    expect(demo.text()).toContain('campaigns.detail.targeting.allAges')
  })

  it('affiche le genre Homme et la tranche d\'âge', () => {
    const wrapper = mountComponent({
      ...baseTargeting,
      gender: 'M',
      age_min: 25,
      age_max: 60,
    })
    const demo = wrapper.find('[data-demographics]')
    expect(demo.text()).toContain('campaigns.detail.targeting.male')
    expect(demo.text()).toContain('campaigns.detail.targeting.age')
  })

  it('affiche le genre Femme', () => {
    const wrapper = mountComponent({
      ...baseTargeting,
      gender: 'F',
    })
    const demo = wrapper.find('[data-demographics]')
    expect(demo.text()).toContain('campaigns.detail.targeting.female')
  })
})
