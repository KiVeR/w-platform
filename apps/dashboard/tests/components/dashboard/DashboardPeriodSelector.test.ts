import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../helpers/stubs'

mockUseI18n()

const DashboardPeriodSelector = (await import('@/components/dashboard/DashboardPeriodSelector.vue')).default

describe('DashboardPeriodSelector', () => {
  it('rend les 3 options de periode', () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: '30d' },
    })

    expect(wrapper.findAll('[data-period-button]')).toHaveLength(3)
  })

  it('emet update:modelValue et change sur une autre periode', async () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: '30d' },
    })

    await wrapper.get('[data-period-button="90d"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['90d'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['90d'])
  })

  it('n emet rien si la periode est deja active', async () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: '30d' },
    })

    await wrapper.get('[data-period-button="30d"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})
