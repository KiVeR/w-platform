import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { LogActivityRow } from '@/types/campaign'

const activities = ref<LogActivityRow[]>([])
const isLoading = ref(false)
const hasError = ref(false)
const fetchActivities = vi.fn()

vi.mock('@/composables/useCampaignActivities', () => ({
  useCampaignActivities: () => ({
    activities,
    isLoading,
    hasError,
    fetchActivities,
  }),
}))

const translations: Record<string, string> = {
  'campaigns.detail.timeline.title': 'Timeline',
  'campaigns.detail.timeline.errorTitle': 'Timeline error',
  'campaigns.detail.timeline.errorDescription': 'Unable to load timeline',
  'campaigns.detail.timeline.retry': 'Retry',
  'campaigns.detail.timeline.emptyTitle': 'No activity',
  'campaigns.detail.timeline.emptyDescription': 'Nothing happened yet',
  'campaigns.detail.timeline.showDetails': 'Show details',
  'campaigns.detail.timeline.hideDetails': 'Hide details',
  'campaigns.detail.timeline.technicalDetails': 'Technical details',
  'campaigns.detail.timeline.source.system': 'System',
  'campaigns.detail.timeline.source.campaign': 'Campaign',
  'campaigns.detail.timeline.source.recipient': 'Recipient',
  'campaigns.detail.timeline.source.log': 'Log',
  'campaigns.detail.timeline.events.created': 'Campaign created',
  'campaigns.detail.timeline.events.deleted': 'Campaign deleted',
  'campaigns.detail.timeline.events.updated': 'Campaign updated',
  'campaigns.detail.timeline.events.statusChanged': 'Status updated from {from} to {to}',
  'campaigns.detail.timeline.events.messageUpdated': 'Message updated',
  'campaigns.detail.timeline.events.senderUpdated': 'Sender updated',
  'campaigns.detail.timeline.events.targetingUpdated': 'Targeting updated',
  'campaigns.detail.timeline.events.scheduledAtUpdated': 'Scheduled for {date}',
  'campaigns.detail.timeline.events.fieldsUpdated': 'Fields updated: {fields}',
  'campaigns.detail.timeline.status.draft': 'Draft',
  'campaigns.detail.timeline.status.scheduled': 'Scheduled',
}

function t(key: string, params?: Record<string, unknown>): string {
  let value = translations[key] ?? key

  for (const [param, replacement] of Object.entries(params ?? {})) {
    value = value.replaceAll(`{${param}}`, String(replacement))
  }

  return value
}

vi.stubGlobal('useI18n', () => ({ t }))

const SectionTimeline = (await import('@/components/campaigns/detail/SectionTimeline.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  CollapsibleSection: {
    template: '<div data-collapsible :data-badge="badge"><slot /></div>',
    props: ['badge', 'title', 'icon', 'open', 'defaultOpen'],
  },
  Badge: { template: '<span v-bind="$attrs"><slot /></span>' },
  Button: { template: '<button v-bind="$attrs"><slot /></button>' },
  EmptyState: { template: '<div data-empty-state>{{ title }}{{ description }}</div>', props: ['title', 'description', 'icon', 'actionLabel'] },
}

function fakeActivity(overrides: Partial<LogActivityRow>): LogActivityRow {
  return {
    id: 1,
    event: 'updated',
    model_type: 'App\\Models\\Campaign',
    model_id: 42,
    old_values: { status: 'draft' },
    new_values: { status: 'scheduled' },
    created_at: '2026-02-05T09:00:00Z',
    ...overrides,
  }
}

describe('SectionTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activities.value = [fakeActivity({})]
    isLoading.value = false
    hasError.value = false
  })

  function mountComponent() {
    return mount(SectionTimeline, {
      props: { campaignId: 42 },
      global: {
        stubs: {
          ...baseStubs,
          Transition: slotStub,
        },
      },
    })
  }

  it('render la timeline avec des descriptions humanisees', () => {
    const wrapper = mountComponent()

    expect(fetchActivities).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-activity-description]').text()).toBe('Status updated from Draft to Scheduled')
    expect(wrapper.get('[data-activity-source]').text()).toBe('Campaign')
  })

  it('ouvre et ferme le detail technique', async () => {
    const wrapper = mountComponent()

    await wrapper.get('[data-activity-detail-toggle]').trigger('click')
    expect(wrapper.find('[data-activity-detail]').exists()).toBe(true)

    await wrapper.get('[data-activity-detail-toggle]').trigger('click')
    expect(wrapper.find('[data-activity-detail]').exists()).toBe(false)
  })

  it('fallback sur System quand model_type est absent', () => {
    activities.value = [fakeActivity({ model_type: null, model_id: null })]

    const wrapper = mountComponent()

    expect(wrapper.get('[data-activity-source]').text()).toBe('System')
  })

  it('affiche un empty state quand il n y a pas d activite', () => {
    activities.value = []

    const wrapper = mountComponent()

    expect(wrapper.find('[data-empty-state]').exists()).toBe(true)
  })

  it('affiche un loading state pendant le fetch', () => {
    isLoading.value = true

    const wrapper = mountComponent()

    expect(wrapper.find('[data-timeline-loading]').exists()).toBe(true)
  })

  it('affiche un etat erreur avec retry', async () => {
    hasError.value = true

    const wrapper = mountComponent()

    expect(wrapper.find('[data-timeline-error]').exists()).toBe(true)
    await wrapper.get('[data-empty-state]').trigger('click')
  })
})
