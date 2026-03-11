import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import type { CampaignStats } from '@/types/campaign'

vi.stubGlobal('computed', computed)
mockUseI18n()

const PerformancePanel = (await import('@/components/campaigns/detail/PerformancePanel.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  Skeleton: { template: '<div data-skeleton />' },
}

const fakeStats: CampaignStats = {
  sent: 12000,
  delivered: 11500,
  undeliverable: 300,
  rejected: 100,
  expired: 100,
  stop: 50,
  clicks: 1200,
  deliverability_rate: 0.958,
  ctr: 0.104,
}

describe('PerformancePanel', () => {
  it('affiche les rates formates en pourcentage', () => {
    const wrapper = mount(PerformancePanel, {
      props: { campaignStatus: 'sent', stats: fakeStats },
      global: { stubs: baseStubs },
    })

    expect(wrapper.get('[data-performance-deliverability]').text()).toBe('95.8 %')
    expect(wrapper.get('[data-performance-ctr]').text()).toBe('10.4 %')
  })

  it('affiche un skeleton quand loading', () => {
    const wrapper = mount(PerformancePanel, {
      props: { campaignStatus: 'sent', isLoading: true },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-performance-loading]').exists()).toBe(true)
    expect(wrapper.findAll('[data-skeleton]')).toHaveLength(3)
  })

  it('masque le panneau si la campagne n est pas envoyee', () => {
    const wrapper = mount(PerformancePanel, {
      props: { campaignStatus: 'draft', stats: fakeStats },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-performance-panel]').exists()).toBe(false)
  })

  it('affiche les compteurs secondaires', () => {
    const wrapper = mount(PerformancePanel, {
      props: { campaignStatus: 'sent', stats: fakeStats },
      global: { stubs: baseStubs },
    })

    expect(wrapper.get('[data-metric="delivered"]').text()).toContain('11')
    expect(wrapper.get('[data-metric="clicks"]').text()).toContain('1')
    expect(wrapper.get('[data-metric="stop"]').text()).toContain('50')
  })

  it('retombe a zero si les stats manquent', () => {
    const wrapper = mount(PerformancePanel, {
      props: { campaignStatus: 'sent', stats: null },
      global: { stubs: baseStubs },
    })

    expect(wrapper.get('[data-performance-deliverability]').text()).toBe('0.0 %')
    expect(wrapper.get('[data-performance-ctr]').text()).toBe('0.0 %')
  })
})
