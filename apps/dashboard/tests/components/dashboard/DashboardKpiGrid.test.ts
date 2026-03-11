import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

vi.stubGlobal('computed', computed)
mockUseI18n()

const DashboardKpiGrid = (await import('@/components/dashboard/DashboardKpiGrid.vue')).default

describe('DashboardKpiGrid', () => {
  function mountComponent(props: Record<string, unknown>) {
    return mount(DashboardKpiGrid, {
      props,
      global: {
        stubs: {
          DashboardKpiCard: {
            template: '<div data-kpi-card :data-loading="loading">{{ label }}|{{ value }}</div>',
            props: ['label', 'value', 'subtitle', 'icon', 'tone', 'loading'],
          },
        },
      },
    })
  }

  it('rend 4 KPI cards', () => {
    const wrapper = mountComponent({
      stats: {
        activeCount: 4,
        scheduledCount: 2,
        errorCount: 1,
        totalVolume: 3600,
      },
      loading: false,
    })

    expect(wrapper.findAll('[data-kpi-card]')).toHaveLength(4)
    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).toContain('3')
  })

  it('propage le loading a chaque card', () => {
    const wrapper = mountComponent({ stats: null, loading: true })

    expect(wrapper.findAll('[data-kpi-card]').every(node => node.attributes('data-loading') === 'true')).toBe(true)
  })
})
