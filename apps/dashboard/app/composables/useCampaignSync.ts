import { onBeforeUnmount } from 'vue'
import { useEcho } from '@/composables/useEcho'

type CampaignCallback = (id: number) => void
type RefreshCallback = () => void

const campaignUpdatedCallbacks = new Set<CampaignCallback>()
const campaignCreatedCallbacks = new Set<CampaignCallback>()
const campaignRefreshCallbacks = new Set<RefreshCallback>()
let listenersStarted = false

function normalizeId(value: unknown): number | null {
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}

export function useCampaignSync() {
  const { isEnabled, listen } = useEcho()

  function setup(): void {
    if (!isEnabled.value || listenersStarted) {
      return
    }

    listenersStarted = true

    listen<{ id: number | string }>('campaign', '.CampaignUpdated', (payload) => {
      const id = normalizeId(payload.id)
      if (id === null) return
      campaignUpdatedCallbacks.forEach(callback => callback(id))
    })

    listen<{ id: number | string }>('campaign', '.CampaignCreated', (payload) => {
      const id = normalizeId(payload.id)
      if (id === null) return
      campaignCreatedCallbacks.forEach(callback => callback(id))
    })

    listen('campaign', '.CampaignRefresh', () => {
      campaignRefreshCallbacks.forEach(callback => callback())
    })
  }

  function onCampaignUpdated(callback: CampaignCallback): void {
    campaignUpdatedCallbacks.add(callback)
    onBeforeUnmount(() => {
      campaignUpdatedCallbacks.delete(callback)
    })
  }

  function onCampaignCreated(callback: CampaignCallback): void {
    campaignCreatedCallbacks.add(callback)
    onBeforeUnmount(() => {
      campaignCreatedCallbacks.delete(callback)
    })
  }

  function onCampaignRefresh(callback: RefreshCallback): void {
    campaignRefreshCallbacks.add(callback)
    onBeforeUnmount(() => {
      campaignRefreshCallbacks.delete(callback)
    })
  }

  return {
    isEnabled,
    setup,
    onCampaignUpdated,
    onCampaignCreated,
    onCampaignRefresh,
  }
}
