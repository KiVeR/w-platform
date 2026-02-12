import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePartnerShops } from '@/composables/usePartnerShops'
import { usePartnerStore } from '@/stores/partner'

export type TargetingMode = 'smart' | 'classic'

const STORAGE_KEY = 'wellpack-targeting-mode'
const CAMPAIGN_THRESHOLD = 20
const SHOP_THRESHOLD = 5

export function useExpertMode() {
  const api = useApi()
  const partnerStore = usePartnerStore()
  const { shops, fetchShops } = usePartnerShops()

  const campaignsTotal = ref<number | null>(null)
  const isLoading = ref(false)

  const storedMode = ref<TargetingMode | null>(
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY) as TargetingMode | null
      : null),
  )

  const isExpert = computed(() => {
    if (campaignsTotal.value !== null && campaignsTotal.value > CAMPAIGN_THRESHOLD) return true
    if (shops.value.length > SHOP_THRESHOLD) return true
    return false
  })

  const effectiveMode = computed<TargetingMode>(() => {
    if (storedMode.value) return storedMode.value
    if (isLoading.value) return 'smart'
    return isExpert.value ? 'classic' : 'smart'
  })

  function setMode(mode: TargetingMode): void {
    storedMode.value = mode
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode)
    }
  }

  async function detect(): Promise<void> {
    isLoading.value = true
    try {
      const partnerId = partnerStore.effectivePartnerId
      if (!partnerId) return

      // Fetch campaign count (lightweight: page 1, 1 item)
      const { data, error } = await api.GET('/campaigns', {
        params: {
          query: {
            'filter[partner_id]': partnerId,
            'page': 1,
            'per_page': 1,
          },
        } as { query: Record<string, unknown> },
      })

      if (!error && data) {
        const raw = data as { meta?: { total?: number } }
        campaignsTotal.value = raw.meta?.total ?? 0
      }

      // Fetch shops (reuse existing composable)
      await fetchShops(partnerId)
    }
    catch {
      // Default to smart mode on error
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    effectiveMode,
    isExpert,
    isLoading,
    storedMode,
    campaignsTotal,
    setMode,
    detect,
  }
}
