import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../../helpers/stubs'

mockUseI18n()

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('lucide-vue-next', () => ({ Copy: { template: '<span data-icon-copy />' } }))

const ShortUrlInfoCard = (await import('@/components/short-urls/detail/ShortUrlInfoCard.vue')).default

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: { template: '<h2><slot /></h2>' },
  CardContent: slotStub,
  Badge: { template: '<span class="badge" v-bind="$attrs"><slot /></span>', props: ['variant'] },
  Button: {
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'size'],
    emits: ['click'],
  },
}

import type { ShortUrl } from '@/types/shortUrl'

const fakeShortUrl: ShortUrl = {
  id: 1,
  slug: 'test-slug',
  link: 'https://example.com/destination',
  click_count: 10,
  click_count_bots: 2,
  is_draft: false,
  import_id: null,
  is_traceable_by_recipient: true,
  is_enabled: true,
}

function mountCard(overrides: Partial<ShortUrl> = {}, canManage = false) {
  return mount(ShortUrlInfoCard, {
    props: { shortUrl: { ...fakeShortUrl, ...overrides }, canManage },
    global: { stubs: baseStubs },
  })
}

describe('ShortUrlInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  it('affiche le slug', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('test-slug')
  })

  it('affiche le lien destination quand link n\'est pas null', () => {
    const wrapper = mountCard()
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com/destination')
    expect(link.text()).toContain('https://example.com/destination')
  })

  it('affiche "Lien interne" quand link est null', () => {
    const wrapper = mountCard({ link: null })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('shortUrls.detail.internalLink')
  })

  it('affiche le badge Activé quand is_enabled est true', () => {
    const wrapper = mountCard({ is_enabled: true })
    expect(wrapper.text()).toContain('shortUrls.detail.enabled')
  })

  it('affiche le badge Désactivé quand is_enabled est false', () => {
    const wrapper = mountCard({ is_enabled: false })
    expect(wrapper.text()).toContain('shortUrls.detail.disabled')
  })

  it('affiche le badge brouillon quand is_draft est true', () => {
    const wrapper = mountCard({ is_draft: true })
    expect(wrapper.text()).toContain('shortUrls.detail.draft')
  })

  it('affiche le badge publié quand is_draft est false', () => {
    const wrapper = mountCard({ is_draft: false })
    expect(wrapper.text()).toContain('shortUrls.detail.published')
  })

  it('affiche le badge traçable quand is_traceable_by_recipient est true', () => {
    const wrapper = mountCard({ is_traceable_by_recipient: true })
    expect(wrapper.text()).toContain('shortUrls.detail.traceable')
  })

  it('affiche le badge non traçable quand is_traceable_by_recipient est false', () => {
    const wrapper = mountCard({ is_traceable_by_recipient: false })
    expect(wrapper.text()).toContain('shortUrls.detail.notTraceable')
  })

  it('affiche l\'import ID quand présent', () => {
    const wrapper = mountCard({ import_id: 'IMP-42' })
    expect(wrapper.text()).toContain('Import: IMP-42')
  })

  it('n\'affiche pas l\'import ID quand absent', () => {
    const wrapper = mountCard({ import_id: null })
    expect(wrapper.text()).not.toContain('Import:')
  })

  it('le bouton copier appelle navigator.clipboard.writeText avec le slug', async () => {
    const wrapper = mountCard()
    await wrapper.find('[data-copy-btn]').trigger('click')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-slug')
  })

  it('n\'affiche pas le bouton toggle quand canManage est false', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-toggle-btn]').exists()).toBe(false)
  })

  it('affiche le bouton toggle quand canManage est true', () => {
    const wrapper = mountCard({}, true)
    expect(wrapper.find('[data-toggle-btn]').exists()).toBe(true)
  })

  it('émet l\'événement toggle au clic sur le bouton toggle', async () => {
    const wrapper = mountCard({}, true)
    await wrapper.find('[data-toggle-btn]').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('le bouton toggle affiche "disabled" quand is_enabled est true (action: désactiver)', () => {
    const wrapper = mountCard({ is_enabled: true }, true)
    const btn = wrapper.find('[data-toggle-btn]')
    expect(btn.text()).toContain('shortUrls.detail.disabled')
  })

  it('le bouton toggle affiche "enabled" quand is_enabled est false (action: activer)', () => {
    const wrapper = mountCard({ is_enabled: false }, true)
    const btn = wrapper.find('[data-toggle-btn]')
    expect(btn.text()).toContain('shortUrls.detail.enabled')
  })
})
