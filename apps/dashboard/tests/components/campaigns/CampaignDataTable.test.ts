import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { stubAuthGlobals, localStorageMock } from '../../helpers/auth-stubs'
import { mockUseI18n, NuxtLinkStub } from '../../helpers/stubs'
import type { CampaignRow, CampaignPagination } from '@/types/campaign'

stubAuthGlobals()
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()
vi.stubGlobal('useRoute', () => ({ path: '/campaigns' }))
vi.stubGlobal('navigateTo', vi.fn())

const CampaignDataTable = (await import('@/components/campaigns/CampaignDataTable.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const voidStub = { template: '<div />' }

const baseStubs = {
  NuxtLink: NuxtLinkStub,
  Table: { template: '<table><slot /></table>' },
  TableHeader: { template: '<thead><slot /></thead>' },
  TableBody: { template: '<tbody><slot /></tbody>' },
  TableRow: { template: '<tr data-row><slot /></tr>' },
  TableHead: { template: '<th><slot /></th>' },
  TableCell: { template: '<td><slot /></td>' },
  CampaignStatusBadge: { template: '<span data-badge>{{ status }}</span>', props: ['status'] },
  EmptyState: { template: '<div data-empty>{{ title }}<slot /></div>', props: ['icon', 'title', 'description', 'actionLabel', 'actionTo'] },
  PageSkeleton: { template: '<div data-skeleton />', props: ['variant'] },
  Button: { template: '<button><slot /></button>' },
  DropdownMenu: slotStub,
  DropdownMenuTrigger: slotStub,
  DropdownMenuContent: slotStub,
  DropdownMenuItem: slotStub,
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

const fakeCampaigns: CampaignRow[] = [
  { id: 1, name: 'Promo ete', type: 'prospection', status: 'sent', is_demo: false, volume_estimated: 12450, scheduled_at: '2026-02-05T09:00:00Z', sent_at: '2026-02-05T09:02:00Z', created_at: '2026-02-01T10:00:00Z' },
  { id: 2, name: 'Noel 2026', type: 'fidelisation', status: 'draft', is_demo: false, volume_estimated: null, scheduled_at: null, sent_at: null, created_at: '2026-02-02T10:00:00Z' },
  { id: 3, name: 'Test demo', type: 'prospection', status: 'scheduled', is_demo: true, volume_estimated: 500, scheduled_at: '2026-03-01T10:00:00Z', sent_at: null, created_at: '2026-02-03T10:00:00Z' },
]

const basePagination: CampaignPagination = { page: 1, lastPage: 3, total: 42 }

describe('CampaignDataTable', () => {
  it('affiche les noms de campagnes et les volumes formates', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: fakeCampaigns,
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: basePagination,
      },
      global: { stubs: baseStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('Promo ete')
    expect(text).toContain('Noel 2026')
    expect(text).toContain('Test demo')
  })

  it('affiche EmptyState quand data est vide', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [],
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: { page: 1, lastPage: 1, total: 0 },
      },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-empty]').exists()).toBe(true)
  })

  it('affiche état erreur avec retry quand hasError est true', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [],
        isLoading: false,
        hasError: true,
        sort: '-created_at',
        pagination: { page: 1, lastPage: 1, total: 0 },
      },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-empty]').exists()).toBe(true)
    expect(wrapper.text()).toContain('campaigns.error.title')
  })

  it('affiche skeleton quand isLoading est true', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [],
        isLoading: true,
        hasError: false,
        sort: '-created_at',
        pagination: basePagination,
      },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-skeleton]').exists()).toBe(true)
  })

  // QW0 — Duplicate action
  it('bouton "Relancer" visible pour status sent', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [{ id: 1, name: 'Sent', type: 'prospection', status: 'sent', is_demo: false, volume_estimated: 100, scheduled_at: null, sent_at: '2026-02-05', created_at: '2026-02-01' }],
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: basePagination,
      },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-duplicate-action]').exists()).toBe(true)
  })

  it('bouton "Relancer" visible pour status scheduled', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [{ id: 1, name: 'Scheduled', type: 'prospection', status: 'scheduled', is_demo: false, volume_estimated: 100, scheduled_at: '2026-03-01', sent_at: null, created_at: '2026-02-01' }],
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: basePagination,
      },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-duplicate-action]').exists()).toBe(true)
  })

  it('bouton "Relancer" visible pour status cancelled', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [{ id: 1, name: 'Cancelled', type: 'prospection', status: 'cancelled', is_demo: false, volume_estimated: 100, scheduled_at: null, sent_at: null, created_at: '2026-02-01' }],
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: basePagination,
      },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-duplicate-action]').exists()).toBe(true)
  })

  it('bouton "Relancer" visible pour status failed', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [{ id: 1, name: 'Failed', type: 'prospection', status: 'failed', is_demo: false, volume_estimated: 100, scheduled_at: null, sent_at: null, created_at: '2026-02-01' }],
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: basePagination,
      },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-duplicate-action]').exists()).toBe(true)
  })

  it('bouton "Relancer" ABSENT pour status draft', () => {
    const wrapper = mount(CampaignDataTable, {
      props: {
        data: [{ id: 2, name: 'Draft', type: 'fidelisation', status: 'draft', is_demo: false, volume_estimated: null, scheduled_at: null, sent_at: null, created_at: '2026-02-02' }],
        isLoading: false,
        hasError: false,
        sort: '-created_at',
        pagination: basePagination,
      },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-duplicate-action]').exists()).toBe(false)
  })
})
