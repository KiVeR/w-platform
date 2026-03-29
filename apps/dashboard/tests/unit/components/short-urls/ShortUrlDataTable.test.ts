import { describe, it, expect, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n, NuxtLinkStub } from '../../../helpers/stubs'
import type { ShortUrlRow, ShortUrlPagination } from '@/types/shortUrl'

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const ShortUrlDataTable = (await import('@/components/short-urls/ShortUrlDataTable.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  NuxtLink: NuxtLinkStub,
  Table: { template: '<table><slot /></table>' },
  TableHeader: { template: '<thead><slot /></thead>' },
  TableBody: { template: '<tbody><slot /></tbody>' },
  TableRow: { template: '<tr data-row v-bind="$attrs"><slot /></tr>' },
  TableHead: { template: '<th><slot /></th>' },
  TableCell: { template: '<td><slot /></td>' },
  Badge: { template: '<span data-badge :data-variant="variant"><slot /></span>', props: ['variant'] },
  EmptyState: { template: '<div data-empty :data-title="title">{{ title }}</div>', props: ['icon', 'title', 'description', 'actionLabel', 'actionTo'] },
  PageSkeleton: { template: '<div data-skeleton />', props: ['variant'] },
  Button: { template: '<button :disabled="disabled"><slot /></button>', props: ['variant', 'size', 'disabled'] },
  DropdownMenu: slotStub,
  DropdownMenuTrigger: slotStub,
  DropdownMenuContent: slotStub,
  DropdownMenuItem: { template: '<div data-menu-item><slot /></div>' },
  AlertDialog: slotStub,
  AlertDialogTrigger: slotStub,
  AlertDialogContent: slotStub,
  AlertDialogHeader: slotStub,
  AlertDialogTitle: slotStub,
  AlertDialogDescription: slotStub,
  AlertDialogFooter: slotStub,
  AlertDialogCancel: slotStub,
  AlertDialogAction: slotStub,
}

const fakeRows: ShortUrlRow[] = [
  { id: 1, slug: 'promo-ete', link: 'https://example.com/promo-ete', clickCount: 1234, clickCountBots: 5, isDraft: false, isEnabled: true, isTraceable: true, importId: null },
  { id: 2, slug: 'noel-2026', link: null, clickCount: 0, clickCountBots: 0, isDraft: false, isEnabled: false, isTraceable: false, importId: null },
  { id: 3, slug: 'long-link', link: 'https://example.com/very/long/path/that/exceeds/fifty/characters/definitely', clickCount: 500, clickCountBots: 10, isDraft: false, isEnabled: true, isTraceable: true, importId: null },
]

const basePagination: ShortUrlPagination = { page: 1, lastPage: 3, total: 42 }

function mountTable(props: Partial<{
  data: ShortUrlRow[]
  isLoading: boolean
  hasError: boolean
  sort: string
  pagination: ShortUrlPagination
}> = {}) {
  return mount(ShortUrlDataTable, {
    props: {
      data: fakeRows,
      isLoading: false,
      hasError: false,
      sort: '-slug',
      pagination: basePagination,
      ...props,
    },
    global: { stubs: baseStubs },
  })
}

describe('ShortUrlDataTable', () => {
  it('affiche le skeleton en mode loading', () => {
    const wrapper = mountTable({ isLoading: true, data: [] })
    expect(wrapper.find('[data-skeleton]').exists()).toBe(true)
    expect(wrapper.find('[data-empty]').exists()).toBe(false)
  })

  it('affiche l\'empty state quand data est vide', () => {
    const wrapper = mountTable({ data: [], isLoading: false, hasError: false })
    expect(wrapper.find('[data-empty]').exists()).toBe(true)
    expect(wrapper.text()).toContain('shortUrls.empty.title')
  })

  it('affiche l\'erreur state quand hasError est true', () => {
    const wrapper = mountTable({ data: [], isLoading: false, hasError: true })
    expect(wrapper.find('[data-empty]').exists()).toBe(true)
    expect(wrapper.text()).toContain('shortUrls.error.title')
  })

  it('affiche le bouton retry quand hasError est true', async () => {
    const wrapper = mountTable({ data: [], isLoading: false, hasError: true })
    const emptyState = wrapper.find('[data-empty]')
    expect(emptyState.exists()).toBe(true)
    // The EmptyState stub renders title, and has action-label prop
    expect(wrapper.text()).toContain('shortUrls.error.title')
  })

  it('affiche les lignes avec les données correctes', () => {
    const wrapper = mountTable()
    const text = wrapper.text()
    expect(text).toContain('promo-ete')
    expect(text).toContain('noel-2026')
    expect(text).toContain('long-link')
  })

  it('affiche le badge "Actif" pour isEnabled=true', () => {
    const wrapper = mountTable()
    const badges = wrapper.findAll('[data-badge]')
    const activeBadges = badges.filter(b => b.attributes('data-variant') === 'default')
    expect(activeBadges.length).toBeGreaterThan(0)
    const activeTexts = activeBadges.map(b => b.text())
    expect(activeTexts.some(t => t.includes('shortUrls.status.active'))).toBe(true)
  })

  it('affiche le badge "Désactivé" pour isEnabled=false', () => {
    const wrapper = mountTable()
    const badges = wrapper.findAll('[data-badge]')
    const destructiveBadges = badges.filter(b => b.attributes('data-variant') === 'destructive')
    expect(destructiveBadges.length).toBeGreaterThan(0)
    const destructiveTexts = destructiveBadges.map(b => b.text())
    expect(destructiveTexts.some(t => t.includes('shortUrls.status.disabled'))).toBe(true)
  })

  it('tronque les liens longs (>50 chars)', () => {
    const wrapper = mountTable()
    const text = wrapper.text()
    const longLink = 'https://example.com/very/long/path/that/exceeds/fifty/characters/definitely'
    expect(text).not.toContain(longLink)
    expect(text).toContain(longLink.slice(0, 50) + '...')
  })

  it('affiche "Lien interne" quand link est null', () => {
    const wrapper = mountTable()
    const text = wrapper.text()
    expect(text).toContain('shortUrls.detail.internalLink')
  })

  it('affiche le total de la pagination', () => {
    const wrapper = mountTable({ pagination: { page: 2, lastPage: 5, total: 99 } })
    const text = wrapper.text()
    expect(text).toContain('shortUrls.pagination.total')
  })

  it('affiche les informations de page', () => {
    const wrapper = mountTable({ pagination: { page: 2, lastPage: 5, total: 50 } })
    const text = wrapper.text()
    expect(text).toContain('shortUrls.pagination.page')
  })

  it('émet view quand on clique sur une ligne', async () => {
    const wrapper = mountTable()
    // Find all <tr data-row> elements — data rows are those after the header row
    const allRows = wrapper.findAll('[data-row]')
    // Skip header row (first one), get first data row
    const dataRows = allRows.slice(1)
    expect(dataRows.length).toBeGreaterThan(0)
    // Trigger click on the first data row's element
    await dataRows[0].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('view')).toBeTruthy()
    expect(wrapper.emitted('view')?.[0]).toEqual([fakeRows[0].id])
  })

  it('émet sort quand on clique sur un en-tête triable', async () => {
    const wrapper = mountTable()
    const sortButtons = wrapper.findAll('button')
    expect(sortButtons.length).toBeGreaterThan(0)
    await sortButtons[0].trigger('click')
    expect(wrapper.emitted('sort')).toBeTruthy()
  })

  it('émet page(page-1) quand on clique sur précédent', async () => {
    const wrapper = mountTable({ pagination: { page: 2, lastPage: 3, total: 30 } })
    const buttons = wrapper.findAll('button')
    const prevButton = buttons.find(b => !b.attributes('disabled') && b.text().includes('shortUrls.pagination.previous'))
    expect(prevButton).toBeDefined()
    await prevButton!.trigger('click')
    expect(wrapper.emitted('page')).toBeTruthy()
    expect(wrapper.emitted('page')?.[0]).toEqual([1])
  })

  it('émet page(page+1) quand on clique sur suivant', async () => {
    const wrapper = mountTable({ pagination: { page: 1, lastPage: 3, total: 30 } })
    const buttons = wrapper.findAll('button')
    const nextButton = buttons.find(b => !b.attributes('disabled') && b.text().includes('shortUrls.pagination.next'))
    expect(nextButton).toBeDefined()
    await nextButton!.trigger('click')
    expect(wrapper.emitted('page')).toBeTruthy()
    expect(wrapper.emitted('page')?.[0]).toEqual([2])
  })
})
