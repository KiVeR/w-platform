import { ref, computed } from 'vue'
import { usePartnerStore } from '@/stores/partner'

/**
 * Composable for scoped wrapper pages.
 * Reads route.params.id, syncs partner store via fetchPartnerInfo + setPartner,
 * and returns { ready, partnerId, error, isInactive }.
 *
 * Edge cases handled:
 * - Invalid (NaN) partnerId → redirect to Hub
 * - Partner not found (404 / deleted) → redirect to Hub
 * - Partner inactive → ready = true, isInactive = true
 */
export function useScopeInit() {
  const route = useRoute()
  const partner = usePartnerStore()
  const ready = ref(false)
  const error = ref<string | null>(null)
  const isInactive = ref(false)

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

      // fetchPartnerInfo catches errors silently — if currentPartnerData is null,
      // it means 404 or an error occurred → redirect to Hub
      if (!partner.currentPartnerData) {
        error.value = 'Partner not found'
        await navigateTo('/hub/dashboard')
        return
      }

      partner.setPartner(partnerId.value, partner.currentPartnerData.name ?? '')

      // Flag inactive partners but still allow the page to render
      if (partner.currentPartnerData.is_active === false) {
        isInactive.value = true
      }

      ready.value = true
    } catch {
      error.value = 'Partner not found'
      await navigateTo('/hub/dashboard')
    }
  })

  return { ready, partnerId, error, isInactive }
}
