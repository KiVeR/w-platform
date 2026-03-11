import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'
import { fakeCampaign } from '../../../helpers/fixtures'
import type { CampaignDetailEnriched } from '@/types/campaign'

vi.stubGlobal('computed', computed)
mockUseI18n()

const CampaignActionsPanel = (await import('@/components/campaigns/detail/CampaignActionsPanel.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardDescription: slotStub,
  CardContent: slotStub,
  Button: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
  Alert: slotStub,
  AlertDescription: slotStub,
  AlertDialog: slotStub,
  AlertDialogTrigger: slotStub,
  AlertDialogContent: slotStub,
  AlertDialogHeader: slotStub,
  AlertDialogTitle: slotStub,
  AlertDialogDescription: slotStub,
  AlertDialogFooter: slotStub,
  AlertDialogCancel: slotStub,
  AlertDialogAction: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
}

const campaign = {
  ...fakeCampaign,
  id: 1,
  partner_id: 42,
  user_id: 1,
  is_demo: false,
  volume_estimated: 12450,
  volume_sent: 12200,
  sms_count: 1,
  routing_status: null,
  router_id: null,
  variable_schema_id: null,
  routing_at: null,
  recipients_count: 72,
  router: null,
} satisfies CampaignDetailEnriched

describe('CampaignActionsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountComponent(props: Record<string, unknown> = {}) {
    return mount(CampaignActionsPanel, {
      props: {
        campaign,
        ...props,
      },
      global: { stubs: baseStubs },
    })
  }

  it('affiche les actions duplicate et export', () => {
    const wrapper = mountComponent({ showDuplicate: true, showExport: true })

    expect(wrapper.find('[data-action-duplicate]').exists()).toBe(true)
    expect(wrapper.find('[data-action-export]').exists()).toBe(true)
  })

  it('emet duplicate', async () => {
    const wrapper = mountComponent({ showDuplicate: true })

    await wrapper.get('[data-action-duplicate]').trigger('click')

    expect(wrapper.emitted('duplicate')?.at(-1)).toEqual([])
  })

  it('emet export', async () => {
    const wrapper = mountComponent({ showExport: true })

    await wrapper.get('[data-action-export]').trigger('click')

    expect(wrapper.emitted('export')?.at(-1)).toEqual([])
  })

  it('demande confirmation avant cancel', async () => {
    const wrapper = mountComponent({ showCancel: true })

    expect(wrapper.find('[data-action-cancel]').exists()).toBe(true)

    await wrapper.get('[data-action-confirm-cancel]').trigger('click')

    expect(wrapper.emitted('cancel')?.at(-1)).toEqual([])
  })

  it('affiche une erreur inline si cancel echoue', () => {
    const wrapper = mountComponent({ cancelError: 'cancel_error' })

    expect(wrapper.find('[data-actions-error]').exists()).toBe(true)
  })
})
