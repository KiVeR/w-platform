import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { mockUseI18n } from '../../../../helpers/stubs'

mockUseI18n()
vi.stubGlobal('computed', computed)

const ShortUrlStatsCard = (await import('@/components/short-urls/detail/ShortUrlStatsCard.vue')).default

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: { template: '<h2><slot /></h2>' },
  CardContent: slotStub,
}

import type { ShortUrl } from '@/types/shortUrl'

const fakeShortUrl: ShortUrl = {
  id: 1,
  slug: 'test-slug',
  link: 'https://example.com',
  click_count: 75,
  click_count_bots: 25,
  is_draft: false,
  import_id: null,
  is_traceable_by_recipient: true,
  is_enabled: true,
}

function mountCard(overrides: Partial<ShortUrl> = {}) {
  return mount(ShortUrlStatsCard, {
    props: { shortUrl: { ...fakeShortUrl, ...overrides } },
    global: { stubs: baseStubs },
  })
}

describe('ShortUrlStatsCard', () => {
  it('affiche les clics humains', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-human-clicks]').text()).toContain('75')
  })

  it('affiche les clics bots', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-bot-clicks]').text()).toContain('25')
  })

  it('affiche le total des clics', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-total-clicks]').text()).toContain('100')
  })

  it('calcule le total correctement', () => {
    const wrapper = mountCard({ click_count: 30, click_count_bots: 20 })
    expect(wrapper.find('[data-total-clicks]').text()).toContain('50')
  })

  it('affiche le pourcentage humain', () => {
    const wrapper = mountCard({ click_count: 75, click_count_bots: 25 })
    expect(wrapper.text()).toContain('75%')
  })

  it('gère le cas 0 clics avec 0%', () => {
    const wrapper = mountCard({ click_count: 0, click_count_bots: 0 })
    expect(wrapper.text()).toContain('0%')
  })

  it('la barre de proportion a la bonne largeur (75%)', () => {
    const wrapper = mountCard({ click_count: 75, click_count_bots: 25 })
    const bar = wrapper.find('[data-proportion-bar] div')
    expect(bar.attributes('style')).toContain('width: 75%')
  })

  it('la barre de proportion a une largeur de 0% quand pas de clics', () => {
    const wrapper = mountCard({ click_count: 0, click_count_bots: 0 })
    const bar = wrapper.find('[data-proportion-bar] div')
    expect(bar.attributes('style')).toContain('width: 0%')
  })

  it('affiche les labels i18n pour les KPI', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('shortUrls.detail.humanClicks')
    expect(wrapper.text()).toContain('shortUrls.detail.botClicks')
    expect(wrapper.text()).toContain('shortUrls.detail.totalClicks')
  })
})
