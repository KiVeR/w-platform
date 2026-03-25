import { ref, computed } from 'vue'
import { usePartnerStore } from '@/stores/partner'

/**
 * Composable for scoped wrapper pages.
 * Reads route.params.id, syncs partner store via fetchPartnerInfo + setPartner,
 * and returns { ready, partnerId, error }.
 * Redirects to Hub dashboard if partnerId is invalid.
 */
export function useScopeInit() {
  const route = useRoute()
  const partner = usePartnerStore()
  const ready = ref(false)
  const error = ref<string | null>(null)

  const partnerId = computed(() => {
    const id = Number(route.params.id)
    return isNaN(id) ? null : id
  })

  onMounted(async () => {
    if (!partnerId.value) {
      await navigateTo('/hub/dashboard')
      return
    }
    try {
      await partner.fetchPartnerInfo(partnerId.value)
      partner.setPartner(partnerId.value, partner.currentPartnerData?.name ?? '')
      ready.value = true
    } catch {
      error.value = 'Partner not found'
      await navigateTo('/hub/dashboard')
    }
  })

  return { ready, partnerId, error }
}
