import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import CampaignMultiStatusFilter from '@/components/campaigns/CampaignMultiStatusFilter.vue'
import { mockUseI18n } from '../../helpers/stubs'

mockUseI18n()

describe('CampaignMultiStatusFilter', () => {
  test('ajoute un statut au filtre', async () => {
    const wrapper = mount(CampaignMultiStatusFilter, {
      props: {
        modelValue: [],
      },
    })

    await wrapper.get('[data-status="draft"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['draft']],
    ])
  })

  test('retire un statut deja selectionne', async () => {
    const wrapper = mount(CampaignMultiStatusFilter, {
      props: {
        modelValue: ['draft', 'sent'],
      },
    })

    await wrapper.get('[data-status="draft"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['sent']],
    ])
  })

  test('efface la selection', async () => {
    const wrapper = mount(CampaignMultiStatusFilter, {
      props: {
        modelValue: ['draft', 'failed'],
      },
    })

    await wrapper.get('[data-status-clear]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [[]],
    ])
  })
})
