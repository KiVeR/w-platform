import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n, NuxtLinkStub } from '../../helpers/stubs'
import { fakeCampaignList } from '../../helpers/fixtures'

mockUseI18n()
vi.stubGlobal('useScopedNavigation', () => ({ scopedRoute: (p: string) => p, hubRoute: (p: string) => p, enterPartner: vi.fn(), exitToHub: vi.fn() }))

const DashboardRecentCampaigns = (await import('@/components/dashboard/DashboardRecentCampaigns.vue')).default

const slotStub = { template: '<div><slot /></div>' }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-11T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DashboardRecentCampaigns', () => {
  function mountComponent(props: Record<string, unknown>) {
    return mount(DashboardRecentCampaigns, {
      props,
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
          Button: slotStub,
          Card: slotStub,
          CardHeader: slotStub,
          CardTitle: slotStub,
          CardDescription: slotStub,
          CardContent: slotStub,
          Skeleton: { template: '<div data-skeleton />' },
          CampaignStatusBadge: { template: '<span data-status>{{ status }}</span>', props: ['status'] },
        },
      },
    })
  }

  it('rend les campagnes recentes avec un lien detail', () => {
    const wrapper = mountComponent({
      loading: false,
      campaigns: [
        { ...fakeCampaignList(1)[0], id: 1, created_at: '2026-03-11T09:00:00Z' },
        { ...fakeCampaignList(1)[0], id: 2, created_at: '2026-03-10T09:00:00Z' },
      ],
    })

    expect(wrapper.findAll('[data-recent-item]')).toHaveLength(2)
    expect(wrapper.html()).toContain('/campaigns/1')
    expect(wrapper.findAll('[data-status]')).toHaveLength(2)
  })

  it('affiche un empty state quand il n y a aucune campagne', () => {
    const wrapper = mountComponent({
      loading: false,
      campaigns: [],
    })

    expect(wrapper.find('[data-recent-empty]').exists()).toBe(true)
  })
})
