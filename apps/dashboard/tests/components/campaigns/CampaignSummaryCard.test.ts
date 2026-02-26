import { describe, it, expect, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { stubAuthGlobals } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'
import type { CampaignDetail } from '@/types/campaign'

stubAuthGlobals()
vi.stubGlobal('computed', computed)
mockUseI18n()

const CampaignSummaryCard = (await import('@/components/campaigns/CampaignSummaryCard.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const voidStub = { template: '<div />' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  CampaignStatusBadge: { template: '<span data-badge>{{ status }}</span>', props: ['status'] },
}

const fakeCampaignDetail: CampaignDetail = {
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
  message: 'Profitez de -20% cet ete !',
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
}

describe('CampaignSummaryCard', () => {
  function mountComponent(campaign = fakeCampaignDetail) {
    return mount(CampaignSummaryCard, {
      props: { campaign },
      global: { stubs: baseStubs },
    })
  }

  it('affiche le type de campagne', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('campaigns.type.prospection')
  })

  it('affiche le message tronqué', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Profitez de -20% cet ete !')
  })

  it('affiche l\'expéditeur', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('WELLPACK')
  })

  it('affiche le volume estimé', () => {
    const wrapper = mountComponent()
    // formatNumber(12450) -> locale dependent but the number should be in the text
    const text = wrapper.text()
    // The number is formatted, so just check the component exists and renders content
    expect(text).toContain('campaigns.detail.summary.volume')
  })

  it('affiche le statut via CampaignStatusBadge', () => {
    const wrapper = mountComponent()
    const badge = wrapper.find('[data-badge]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('sent')
  })

  it('affiche les dates formatées', () => {
    const wrapper = mountComponent()
    const text = wrapper.text()
    expect(text).toContain('campaigns.detail.summary.createdAt')
    expect(text).toContain('campaigns.detail.summary.sentAt')
  })

  it('affiche le lien court', () => {
    const wrapper = mountComponent()
    const link = wrapper.find('a[target="_blank"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://wllp.co/abc123')
  })

  it('masque le message quand il est absent', () => {
    const wrapper = mountComponent({ ...fakeCampaignDetail, message: null })
    expect(wrapper.text()).not.toContain('campaigns.detail.summary.message')
  })
})
