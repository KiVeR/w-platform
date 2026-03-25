import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY = 'wellpack-partner-context'

export interface PartnerData {
  id: number
  name: string
  euro_credits?: number
  is_active?: boolean
}

export const usePartnerStore = defineStore('partner', () => {
  const currentPartnerId = ref<number | null>(null)
  const currentPartnerName = ref<string | null>(null)
  const currentPartnerData = ref<PartnerData | null>(null)

  const auth = useAuthStore()

  /** All internal (non-partner-bound) roles can switch partner context. */
  const canSwitchPartner = computed(() => !auth.isPartnerBound)

  const isScoped = computed(() => currentPartnerId.value !== null)

  /**
   * Effective partner ID resolution:
   * 1. Route param (scope mode via URL) — checked by consumers via useNavigationMode
   * 2. Manual selection in store (admin/adv switching)
   * 3. Auth partner_id (partner-bound users)
   */
  const effectivePartnerId = computed(() => {
    if (canSwitchPartner.value) return currentPartnerId.value
    return auth.partnerId
  })

  function setPartner(id: number, name: string) {
    if (!canSwitchPartner.value) return
    currentPartnerId.value = id
    currentPartnerName.value = name
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name }))
  }

  function clearPartner() {
    if (!canSwitchPartner.value) return
    currentPartnerId.value = null
    currentPartnerName.value = null
    currentPartnerData.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  async function fetchPartnerInfo(id: number) {
    try {
      const api = useNuxtApp().$api
      const { data } = await api.GET('/partners/{partner}', {
        params: { path: { partner: id } },
      })
      if (data?.data) {
        currentPartnerData.value = {
          id: data.data.id,
          name: data.data.name,
          euro_credits: data.data.euro_credits != null ? Number(data.data.euro_credits) : undefined,
          is_active: data.data.is_active,
        }
        // Sync name with the fetched data
        currentPartnerName.value = data.data.name
      }
    } catch {
      // Silently fail — the partner info is supplementary
    }
  }

  function init() {
    if (!canSwitchPartner.value) return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const { id, name } = JSON.parse(raw)
      currentPartnerId.value = id
      currentPartnerName.value = name
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    currentPartnerId,
    currentPartnerName,
    currentPartnerData,
    isScoped,
    canSwitchPartner,
    effectivePartnerId,
    setPartner,
    clearPartner,
    fetchPartnerInfo,
    init,
  }
})
