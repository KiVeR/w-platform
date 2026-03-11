import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import CampaignDateRangeFilter from '@/components/campaigns/CampaignDateRangeFilter.vue'
import { mockUseI18n } from '../../helpers/stubs'

mockUseI18n()

describe('CampaignDateRangeFilter', () => {
  test('emet une nouvelle date de debut', async () => {
    const wrapper = mount(CampaignDateRangeFilter, {
      props: {
        modelValue: { from: '', to: '' },
      },
    })

    await wrapper.get('[data-date-from]').setValue('2026-03-01')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ from: '2026-03-01', to: '' }],
    ])
  })

  test('emet une nouvelle date de fin', async () => {
    const wrapper = mount(CampaignDateRangeFilter, {
      props: {
        modelValue: { from: '2026-03-01', to: '' },
      },
    })

    await wrapper.get('[data-date-to]').setValue('2026-03-31')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ from: '2026-03-01', to: '2026-03-31' }],
    ])
  })

  test('efface la plage', async () => {
    const wrapper = mount(CampaignDateRangeFilter, {
      props: {
        modelValue: { from: '2026-03-01', to: '2026-03-31' },
      },
    })

    await wrapper.get('[data-date-clear]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ from: '', to: '' }],
    ])
  })
})
