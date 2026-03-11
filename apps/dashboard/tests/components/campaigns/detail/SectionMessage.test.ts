import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import type { CampaignDetailEnriched } from '@/types/campaign'

vi.stubGlobal('computed', computed)
mockUseI18n()

const SectionMessage = (await import('@/components/campaigns/detail/SectionMessage.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  CollapsibleSection: slotStub,
  Badge: { template: '<span><slot /></span>' },
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
}

const longMessage = 'A'.repeat(180)

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
  message: longMessage,
  sender: 'WELLPACK',
  additional_phone: null,
  sms_count: 2,
  short_url: 'https://wllp.co/abc123',
  scheduled_at: null,
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

describe('SectionMessage', () => {
  it('tronque le message long', () => {
    const wrapper = mount(SectionMessage, {
      props: { campaign: fakeCampaign },
      global: { stubs: baseStubs },
    })

    expect(wrapper.get('[data-message-content]').text().length).toBeLessThan(longMessage.length)
    expect(wrapper.get('[data-message-content]').text()).toContain('…')
  })

  it('toggle entre voir complet et replie', async () => {
    const wrapper = mount(SectionMessage, {
      props: { campaign: fakeCampaign },
      global: { stubs: baseStubs },
    })

    await wrapper.get('[data-message-toggle]').trigger('click')

    expect(wrapper.get('[data-message-content]').text()).toBe(longMessage)
  })

  it('affiche short_url si present', () => {
    const wrapper = mount(SectionMessage, {
      props: { campaign: fakeCampaign },
      global: { stubs: baseStubs },
    })

    const link = wrapper.get('[data-short-url]')
    expect(link.attributes('href')).toBe('https://wllp.co/abc123')
  })

  it('affiche l expediteur et le compteur SMS', () => {
    const wrapper = mount(SectionMessage, {
      props: { campaign: fakeCampaign },
      global: { stubs: baseStubs },
    })

    expect(wrapper.text()).toContain('WELLPACK')
    expect(wrapper.text()).toContain('2')
  })

  it('affiche un placeholder si le message manque', () => {
    const wrapper = mount(SectionMessage, {
      props: {
        campaign: {
          ...fakeCampaign,
          message: null,
        },
      },
      global: { stubs: baseStubs },
    })

    expect(wrapper.get('[data-message-content]').text()).toContain('campaigns.detail.summary.emptyMessage')
  })
})
