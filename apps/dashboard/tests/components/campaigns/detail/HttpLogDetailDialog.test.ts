import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { CampaignLogRow } from '@/types/campaign'

const translations: Record<string, string> = {
  'campaigns.detail.logs.dialog.title': 'HTTP log details',
  'campaigns.detail.logs.dialog.description': 'Inspect the provider payload',
  'campaigns.detail.logs.dialog.context': 'Context',
  'campaigns.detail.logs.dialog.close': 'Close',
  'campaigns.detail.logs.phase.routing': 'Routing',
  'campaigns.detail.logs.level.error': 'Error',
}

function t(key: string): string {
  return translations[key] ?? key
}

vi.stubGlobal('useI18n', () => ({ t }))

const HttpLogDetailDialog = (await import('@/components/campaigns/detail/HttpLogDetailDialog.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Dialog: slotStub,
  DialogContent: { template: '<div v-bind="$attrs"><slot /></div>' },
  DialogHeader: slotStub,
  DialogTitle: slotStub,
  DialogDescription: slotStub,
  DialogFooter: slotStub,
  ScrollArea: { template: '<div><slot /></div>' },
  Badge: { template: '<span><slot /></span>' },
  Button: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
}

const fakeLog: CampaignLogRow = {
  id: 1,
  campaign_id: 42,
  data: {
    phase: 'routing',
    level: 'error',
    message: 'Provider timeout',
    type: 'request',
    context: { nested: { ok: false } },
  },
  created_at: '2026-02-05T09:00:00Z',
}

describe('HttpLogDetailDialog', () => {
  function mountComponent() {
    return mount(HttpLogDetailDialog, {
      props: { open: true, log: fakeLog },
      global: { stubs: baseStubs },
    })
  }

  it('affiche le JSON formate', () => {
    const wrapper = mountComponent()

    expect(wrapper.get('[data-log-dialog-message]').text()).toBe('Provider timeout')
    expect(wrapper.get('[data-log-dialog-json]').text()).toContain('"phase": "routing"')
    expect(wrapper.get('[data-log-dialog-json]').text()).toContain('"nested"')
  })

  it('emet la fermeture du dialog', async () => {
    const wrapper = mountComponent()

    await wrapper.get('[data-log-dialog-close]').trigger('click')

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})
