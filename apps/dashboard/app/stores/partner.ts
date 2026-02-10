import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY = 'wellpack-partner-context'

export const usePartnerStore = defineStore('partner', () => {
  const currentPartnerId = ref<number | null>(null)
  const currentPartnerName = ref<string | null>(null)

  const auth = useAuthStore()

  const isScoped = computed(() => currentPartnerId.value !== null)

  const effectivePartnerId = computed(() => {
    if (auth.isAdmin) return currentPartnerId.value
    return auth.partnerId
  })

  function setPartner(id: number, name: string) {
    if (!auth.isAdmin) return
    currentPartnerId.value = id
    currentPartnerName.value = name
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name }))
  }

  function clearPartner() {
    if (!auth.isAdmin) return
    currentPartnerId.value = null
    currentPartnerName.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function init() {
    if (!auth.isAdmin) return
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
    isScoped,
    effectivePartnerId,
    setPartner,
    clearPartner,
    init,
  }
})
