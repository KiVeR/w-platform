import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { CampaignDetailEnriched } from '@/types/campaign'

vi.stubGlobal('computed', computed)
mockUseI18n()

const ContextBar = (await import('@/components/campaigns/detail/ContextBar.vue')).default

const fakeCampaign: CampaignDetailEnriched = {
  id: 1,
  partner_id: 42,
  user_id: 1,
  type: 'prospection',
  channel: 'sms',
  status: 'sent',
  is_demo: false,
  name: 'Promo ete 2026',
  targeting: null,
  volume_estimated: 12450,
  volume_sent: 12200,
  message: 'Profitez de -20%',
  sender: 'WELLPACK',
  additional_phone: null,
  sms_count: 1,
  short_url: 'https://wllp.co/abc123',
  scheduled_at: '2026-02-05T09:00:00Z',
  sent_at: '2026-02-05T09:02:00Z',
  unit_price: '0.045',
  total_price: '560.25',
  created_at: '2026-02-01T10:00:00Z',
  partner: { id: 42, name: 'Test Partner' },
  creator: { id: 1, full_name: 'Jean Dupont' },
  routing_status: null,
  router_id: null,
  variable_schema_id: null,
  routing_at: null,
  recipients_count: 72,
  router: null,
}

const baseStubs = {
  Badge: { template: '<span data-type-badge><slot /></span>' },
}

describe('ContextBar', () => {
  it('affiche les 4 infos formatees', () => {
    const wrapper = mount(ContextBar, {
      props: { campaign: fakeCampaign },
      global: { stubs: baseStubs },
    })

    expect(wrapper.text()).toContain('campaigns.type.prospection')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain(formatCurrency(560.25))
    expect(wrapper.text()).toContain(formatDateTime('2026-02-05T09:02:00Z'))
  })

  it('affiche la date planifiee si la campagne n est pas encore envoyee', () => {
    const wrapper = mount(ContextBar, {
      props: {
        campaign: {
          ...fakeCampaign,
          status: 'scheduled',
          sent_at: null,
        },
      },
      global: { stubs: baseStubs },
    })

    expect(wrapper.text()).toContain('campaigns.detail.summary.scheduledAt')
    expect(wrapper.text()).toContain(formatDateTime('2026-02-05T09:00:00Z'))
  })

  it('garde une grille responsive', () => {
    const wrapper = mount(ContextBar, {
      props: { campaign: fakeCampaign },
      global: { stubs: baseStubs },
    })

    expect(wrapper.get('[data-context-bar]').classes()).toContain('sm:grid-cols-2')
    expect(wrapper.get('[data-context-bar]').classes()).toContain('lg:grid-cols-4')
  })

  it('affiche un tiret si le prix total manque', () => {
    const wrapper = mount(ContextBar, {
      props: {
        campaign: {
          ...fakeCampaign,
          total_price: null,
        },
      },
      global: { stubs: baseStubs },
    })

    expect(wrapper.get('[data-context-item="price"]').text()).toContain('—')
  })
})
