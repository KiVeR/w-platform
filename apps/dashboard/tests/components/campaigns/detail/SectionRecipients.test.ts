import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import type { CampaignRecipientRow, RecipientFilters, RecipientPagination } from '@/types/campaign'

const recipients = ref<CampaignRecipientRow[]>([])
const pagination = ref<RecipientPagination>({ page: 1, lastPage: 1, total: 0, perPage: 15 })
const filters = ref<RecipientFilters>({ search: '', statuses: [] })
const isLoading = ref(false)
const hasError = ref(false)
const fetchRecipients = vi.fn()
const setPage = vi.fn()
const setPerPage = vi.fn()
const setFilters = vi.fn((next: Partial<RecipientFilters>) => {
  Object.assign(filters.value, next)
})

vi.mock('@/composables/useCampaignRecipients', () => ({
  useCampaignRecipients: () => ({
    recipients,
    pagination,
    filters,
    isLoading,
    hasError,
    fetchRecipients,
    setPage,
    setPerPage,
    setFilters,
  }),
}))

mockUseI18n()

const SectionRecipients = (await import('@/components/campaigns/detail/SectionRecipients.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  CollapsibleSection: {
    template: '<div data-collapsible :data-badge="badge"><slot /></div>',
    props: ['badge', 'title', 'icon', 'open', 'defaultOpen'],
  },
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
  Badge: { template: '<span v-bind="$attrs"><slot /></span>' },
  Input: { template: '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">', props: ['modelValue'] },
  NativeSelect: { template: '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>', props: ['modelValue'] },
  Table: slotStub,
  TableHeader: slotStub,
  TableHead: slotStub,
  TableBody: slotStub,
  TableRow: slotStub,
  TableCell: slotStub,
  EmptyState: { template: '<div data-empty-state>{{ title }}{{ description }}</div>', props: ['title', 'description', 'icon', 'actionLabel'] },
}

const fakeRecipient: CampaignRecipientRow = {
  id: 1,
  campaign_id: 42,
  status: 'DELIVERED',
  phone_number: '+33612345678',
  message_preview: 'Profitez de -20% cet ete sur toute la collection SMS.',
  message_preview_length: 52,
  short_url_suffix: 'abc123',
  short_url_slug: 'promo-ete',
  short_url_click: 8,
  additional_information: { provider: 'sinch' },
  stop_requested_at: null,
  delivered_at: '2026-02-05T09:05:00Z',
}

describe('SectionRecipients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    recipients.value = [fakeRecipient]
    pagination.value = { page: 1, lastPage: 5, total: 72, perPage: 15 }
    filters.value = { search: '', statuses: [] }
    isLoading.value = false
    hasError.value = false
  })

  function mountComponent() {
    return mount(SectionRecipients, {
      props: { campaignId: 42 },
      global: { stubs: baseStubs },
    })
  }

  it('render la table avec les destinataires', () => {
    const wrapper = mountComponent()

    expect(fetchRecipients).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-recipients-table]').exists()).toBe(true)
    expect(wrapper.text()).toContain('campaigns.detail.recipients.columns.phone')
  })

  it('filtre par statut avec le mapping backend reel', async () => {
    const wrapper = mountComponent()
    fetchRecipients.mockClear()

    await wrapper.get('[data-filter="failed"]').trigger('click')

    expect(setFilters).toHaveBeenCalledWith({ statuses: ['FAILED', 'REJECTED', 'UNDELIVERABLE'] })
    expect(fetchRecipients).toHaveBeenCalledTimes(1)
  })

  it('search applique un debounce avant setFilters', async () => {
    vi.useFakeTimers()
    const wrapper = mountComponent()
    fetchRecipients.mockClear()
    setFilters.mockClear()

    await wrapper.get('[data-search-input]').setValue('+33699')
    await vi.advanceTimersByTimeAsync(250)

    expect(setFilters).toHaveBeenCalledWith({ search: '+33699' })
    expect(fetchRecipients).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('pagination affiche le total et navigue', async () => {
    const wrapper = mountComponent()

    expect(wrapper.get('[data-pagination-summary]').text()).toContain('campaigns.detail.recipients.pagination.summary')

    await wrapper.get('[data-pagination-next]').trigger('click')

    expect(setPage).toHaveBeenCalledWith(2)
  })

  it('affiche un empty state quand il n y a pas de destinataires', () => {
    recipients.value = []
    pagination.value.total = 0

    const wrapper = mountComponent()

    expect(wrapper.find('[data-empty-state]').exists()).toBe(true)
  })

  it('affiche le badge count avec le total', () => {
    const wrapper = mountComponent()

    expect(wrapper.get('[data-collapsible]').attributes('data-badge')).toBe('72')
  })

  it('garde les wrappers responsive table + cards', () => {
    const wrapper = mountComponent()

    expect(wrapper.get('[data-recipients-table]').classes()).toContain('md:block')
    expect(wrapper.get('[data-recipients-mobile]').classes()).toContain('md:hidden')
  })

  it('masque correctement le numero de telephone', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('+336••78')
    expect(wrapper.text()).not.toContain('+33612345678')
  })
})
