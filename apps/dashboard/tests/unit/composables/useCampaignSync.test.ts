import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

type EventHandler = (payload?: { id?: number | string }) => void

async function mountHarness(options?: { enabled?: boolean, setupTwice?: boolean }) {
  vi.resetModules()

  const handlers = new Map<string, EventHandler>()
  const listen = vi.fn((channel: string, event: string, callback: EventHandler) => {
    handlers.set(`${channel}:${event}`, callback)
  })

  vi.doMock('@/composables/useEcho', () => ({
    useEcho: () => ({
      isEnabled: computed(() => options?.enabled ?? true),
      listen,
      stopListening: vi.fn(),
    }),
  }))

  const { useCampaignSync } = await import('@/composables/useCampaignSync')

  const onUpdated = vi.fn()
  const onCreated = vi.fn()
  const onRefresh = vi.fn()

  mount(defineComponent({
    setup() {
      const sync = useCampaignSync()
      sync.onCampaignUpdated(onUpdated)
      sync.onCampaignCreated(onCreated)
      sync.onCampaignRefresh(onRefresh)
      sync.setup()

      if (options?.setupTwice) {
        sync.setup()
      }

      return () => h('div')
    },
  }))

  return {
    handlers,
    listen,
    onUpdated,
    onCreated,
    onRefresh,
  }
}

describe('useCampaignSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers listeners for the 3 campaign events', async () => {
    const { listen } = await mountHarness()

    expect(listen).toHaveBeenCalledTimes(3)
    expect(listen).toHaveBeenCalledWith('campaign', '.CampaignUpdated', expect.any(Function))
    expect(listen).toHaveBeenCalledWith('campaign', '.CampaignCreated', expect.any(Function))
    expect(listen).toHaveBeenCalledWith('campaign', '.CampaignRefresh', expect.any(Function))
  })

  it('forwards CampaignUpdated payloads to registered callbacks', async () => {
    const { handlers, onUpdated } = await mountHarness()

    handlers.get('campaign:.CampaignUpdated')?.({ id: '42' })

    expect(onUpdated).toHaveBeenCalledWith(42)
  })

  it('forwards CampaignCreated payloads to registered callbacks', async () => {
    const { handlers, onCreated } = await mountHarness()

    handlers.get('campaign:.CampaignCreated')?.({ id: 7 })

    expect(onCreated).toHaveBeenCalledWith(7)
  })

  it('forwards CampaignRefresh events to registered callbacks', async () => {
    const { handlers, onRefresh } = await mountHarness()

    handlers.get('campaign:.CampaignRefresh')?.()

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('ignores malformed payloads without numeric ids', async () => {
    const { handlers, onUpdated, onCreated } = await mountHarness()

    handlers.get('campaign:.CampaignUpdated')?.({ id: 'not-a-number' })
    handlers.get('campaign:.CampaignCreated')?.({})

    expect(onUpdated).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('does not register duplicate listeners when setup runs twice', async () => {
    const { listen } = await mountHarness({ setupTwice: true })

    expect(listen).toHaveBeenCalledTimes(3)
  })

  it('stays inert when websocket is disabled', async () => {
    const { listen } = await mountHarness({ enabled: false })

    expect(listen).not.toHaveBeenCalled()
  })
})
