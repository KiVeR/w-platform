import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import type { CampaignTargeting } from '@/types/campaign'

vi.stubGlobal('computed', computed)
mockUseI18n()

const SectionTargeting = (await import('@/components/campaigns/detail/SectionTargeting.vue')).default

const baseStubs = {
  CollapsibleSection: { template: '<div><slot /></div>' },
  TargetingSummary: { template: '<div data-targeting-summary />' },
}

const fakeTargeting: CampaignTargeting = {
  method: 'postcode',
  departments: [],
  postcodes: ['75001'],
  communes: [],
  iris_codes: [],
  address: null,
  lat: null,
  lng: null,
  radius: null,
  gender: null,
  age_min: null,
  age_max: null,
}

describe('SectionTargeting', () => {
  it('render TargetingSummary dans la section', () => {
    const wrapper = mount(SectionTargeting, {
      props: { targeting: fakeTargeting },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-targeting-summary]').exists()).toBe(true)
  })

  it('affiche un placeholder si le ciblage est absent', () => {
    const wrapper = mount(SectionTargeting, {
      props: { targeting: null },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-section-targeting-empty]').exists()).toBe(true)
  })

  it('relaye update:open', async () => {
    const wrapper = mount(SectionTargeting, {
      props: { targeting: fakeTargeting },
      global: {
        stubs: {
          CollapsibleSection: {
            template: '<button data-open @click="$emit(\'update:open\', true)"><slot /></button>',
          },
          TargetingSummary: { template: '<div data-targeting-summary />' },
        },
      },
    })

    await wrapper.get('[data-open]').trigger('click')

    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
  })
})
