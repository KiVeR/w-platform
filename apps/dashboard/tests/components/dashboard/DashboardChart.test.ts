import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

vi.stubGlobal('computed', computed)
mockUseI18n()

const DashboardChart = (await import('@/components/dashboard/DashboardChart.vue')).default

const slotStub = { template: '<div><slot /></div>' }

describe('DashboardChart', () => {
  function mountComponent(props: Record<string, unknown>) {
    return mount(DashboardChart, {
      props,
      global: {
        stubs: {
          Card: slotStub,
          CardHeader: slotStub,
          CardTitle: slotStub,
          CardDescription: slotStub,
          CardContent: slotStub,
        },
      },
    })
  }

  it('affiche le skeleton quand loading', () => {
    const wrapper = mountComponent({
      isLoading: true,
      volumeData: null,
      activityData: null,
    })

    expect(wrapper.find('[data-chart-loading]').exists()).toBe(true)
  })

  it('affiche un etat vide quand toutes les series sont a zero', () => {
    const wrapper = mountComponent({
      isLoading: false,
      volumeData: { labels: ['09/03', '10/03'], values: [0, 0] },
      activityData: { labels: ['09/03', '10/03'], values: [0, 0] },
    })

    expect(wrapper.find('[data-chart-empty]').exists()).toBe(true)
  })

  it('rend le svg et les barres quand des donnees existent', () => {
    const wrapper = mountComponent({
      isLoading: false,
      volumeData: { labels: ['09/03', '10/03', '11/03'], values: [500, 1200, 800] },
      activityData: { labels: ['09/03', '10/03', '11/03'], values: [1, 3, 2] },
    })

    expect(wrapper.find('[data-chart-svg]').exists()).toBe(true)
    expect(wrapper.findAll('rect')).toHaveLength(3)
    expect(wrapper.find('polyline').exists()).toBe(true)
  })
})
