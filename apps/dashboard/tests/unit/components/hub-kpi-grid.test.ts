import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { stubAuthGlobals } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'
import type { HubStats } from '@/types/hub'

stubAuthGlobals()
vi.stubGlobal('computed', computed)
mockUseI18n()

const HubKpiGrid = (await import('@/components/hub/HubKpiGrid.vue')).default

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

function mountGrid(stats: HubStats | null, loading = false) {
  return mount(HubKpiGrid, {
    props: { stats, loading },
    global: {
      stubs: {
        DashboardKpiCard: {
          template: '<div data-kpi-card :data-key="$attrs[\'data-key\']"><span data-kpi-label>{{ label }}</span><span data-kpi-value>{{ value }}</span></div>',
          props: ['label', 'value', 'subtitle', 'icon', 'tone', 'loading'],
        },
      },
    },
  })
}

describe('HubKpiGrid', () => {
  it('renders 3 KPI cards', () => {
    const wrapper = mountGrid({
      partnersCount: 10,
      activePartnersCount: 8,
      totalCredits: 5000,
      totalDemandes: 15,
    })

    const cards = wrapper.findAll('[data-kpi-card]')
    expect(cards).toHaveLength(3)
  })

  it('displays partners active/total in first card', () => {
    const wrapper = mountGrid({
      partnersCount: 10,
      activePartnersCount: 8,
      totalCredits: 5000,
      totalDemandes: 15,
    })

    const values = wrapper.findAll('[data-kpi-value]')
    // "8 / 10" formatted with French number formatting
    expect(values[0].text()).toContain('8')
    expect(values[0].text()).toContain('10')
  })

  it('displays total demandes in third card', () => {
    const wrapper = mountGrid({
      partnersCount: 3,
      activePartnersCount: 2,
      totalCredits: 100,
      totalDemandes: 42,
    })

    const values = wrapper.findAll('[data-kpi-value]')
    expect(values[2].text()).toBe('42')
  })

  it('renders 0 values when stats is null', () => {
    const wrapper = mountGrid(null)

    const values = wrapper.findAll('[data-kpi-value]')
    expect(values[0].text()).toContain('0')
  })

  it('has data-hub-kpi-grid attribute', () => {
    const wrapper = mountGrid(null)
    expect(wrapper.find('[data-hub-kpi-grid]').exists()).toBe(true)
  })
})
