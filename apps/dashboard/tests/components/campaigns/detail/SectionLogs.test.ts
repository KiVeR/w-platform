import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { CampaignLogRow } from '@/types/campaign'

const logs = ref<CampaignLogRow[]>([])
const isLoading = ref(false)
const hasError = ref(false)
const fetchLogs = vi.fn()

vi.mock('@/composables/useCampaignLogs', () => ({
  useCampaignLogs: () => ({
    logs,
    isLoading,
    hasError,
    fetchLogs,
  }),
}))

const translations: Record<string, string> = {
  'campaigns.detail.logs.title': 'HTTP logs',
  'campaigns.detail.logs.errorTitle': 'Logs error',
  'campaigns.detail.logs.errorDescription': 'Unable to load logs',
  'campaigns.detail.logs.retry': 'Retry',
  'campaigns.detail.logs.emptyTitle': 'No logs',
  'campaigns.detail.logs.emptyDescription': 'No HTTP log available',
  'campaigns.detail.logs.columns.date': 'Date',
  'campaigns.detail.logs.columns.phase': 'Phase',
  'campaigns.detail.logs.columns.message': 'Message',
  'campaigns.detail.logs.columns.type': 'Type',
  'campaigns.detail.logs.columns.level': 'Level',
  'campaigns.detail.logs.columns.actions': 'Actions',
  'campaigns.detail.logs.details': 'Details',
  'campaigns.detail.logs.phase.routing': 'Routing',
  'campaigns.detail.logs.phase.query': 'Query',
  'campaigns.detail.logs.phase.sending': 'Sending',
  'campaigns.detail.logs.phase.unknown': 'Unknown',
  'campaigns.detail.logs.level.info': 'Info',
  'campaigns.detail.logs.level.warning': 'Warning',
  'campaigns.detail.logs.level.error': 'Error',
}

function t(key: string): string {
  return translations[key] ?? key
}

vi.stubGlobal('useI18n', () => ({ t }))

const SectionLogs = (await import('@/components/campaigns/detail/SectionLogs.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  CollapsibleSection: {
    template: '<div data-collapsible :data-badge="badge"><slot /></div>',
    props: ['badge', 'title', 'icon', 'open', 'defaultOpen'],
  },
  Table: slotStub,
  TableHeader: slotStub,
  TableHead: slotStub,
  TableBody: slotStub,
  TableRow: slotStub,
  TableCell: slotStub,
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
  Badge: { template: '<span v-bind="$attrs"><slot /></span>' },
  EmptyState: { template: '<div data-empty-state>{{ title }}{{ description }}</div>', props: ['title', 'description', 'icon', 'actionLabel'] },
  HttpLogDetailDialog: {
    template: '<div v-if="open" data-log-dialog>{{ log?.data?.message }}</div>',
    props: ['open', 'log'],
  },
}

const fakeLog: CampaignLogRow = {
  id: 1,
  campaign_id: 42,
  data: {
    phase: 'routing',
    level: 'error',
    message: 'Provider timeout',
    type: 'request',
  },
  created_at: '2026-02-05T09:00:00Z',
}

describe('SectionLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logs.value = [fakeLog]
    isLoading.value = false
    hasError.value = false
  })

  function mountComponent() {
    return mount(SectionLogs, {
      props: { campaignId: 42 },
      global: { stubs: baseStubs },
    })
  }

  it('render la table de logs avec badges', () => {
    const wrapper = mountComponent()

    expect(fetchLogs).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-logs-table]').exists()).toBe(true)
    expect(wrapper.get('[data-phase-badge]').text()).toBe('Routing')
    expect(wrapper.get('[data-level-badge]').text()).toBe('Error')
  })

  it('ouvre le dialog detail', async () => {
    const wrapper = mountComponent()

    await wrapper.get('[data-log-details-button]').trigger('click')

    expect(wrapper.find('[data-log-dialog]').exists()).toBe(true)
    expect(wrapper.find('[data-log-dialog]').text()).toContain('Provider timeout')
  })

  it('affiche un empty state quand il n y a pas de logs', () => {
    logs.value = []

    const wrapper = mountComponent()

    expect(wrapper.find('[data-empty-state]').exists()).toBe(true)
  })

  it('affiche un etat loading', () => {
    isLoading.value = true

    const wrapper = mountComponent()

    expect(wrapper.find('[data-logs-loading]').exists()).toBe(true)
  })

  it('affiche un etat erreur', () => {
    hasError.value = true

    const wrapper = mountComponent()

    expect(wrapper.find('[data-logs-error]').exists()).toBe(true)
  })
})
