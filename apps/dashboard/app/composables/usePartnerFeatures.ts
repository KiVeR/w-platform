import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { PartnerFeature } from '@/types/partner'

export function usePartnerFeatures() {
  const api = useApi()

  const features = ref<PartnerFeature[]>([])
  const isLoading = ref(false)
  const isToggling = ref(false)
  const hasError = ref(false)

  async function fetchFeatures(partnerId: number): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/partners/{partner}/features', {
        params: { path: { partner: partnerId } },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Array<{ key: string; is_enabled: boolean }> }
        features.value = raw.data.map(f => ({
          key: f.key,
          is_enabled: f.is_enabled,
        }))
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function toggleFeature(
    partnerId: number,
    key: string,
    enabled: boolean,
  ): Promise<boolean> {
    isToggling.value = true
    try {
      const { error } = await api.PUT('/partners/{partner}/features/{feature}' as never, {
        params: { path: { partner: partnerId, feature: key } },
        body: { is_enabled: enabled },
      } as never)

      if (error) return false

      // Update local state
      const feature = features.value.find(f => f.key === key)
      if (feature) {
        feature.is_enabled = enabled
      }
      return true
    }
    catch {
      return false
    }
    finally {
      isToggling.value = false
    }
  }

  return {
    features,
    isLoading,
    isToggling,
    hasError,
    fetchFeatures,
    toggleFeature,
  }
}
