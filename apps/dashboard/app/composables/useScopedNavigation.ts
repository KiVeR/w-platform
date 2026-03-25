import { useNavigationMode } from '@/composables/useNavigationMode'
import { usePartnerStore } from '@/stores/partner'

export function useScopedNavigation() {
  const { isScope, scopedPartnerId } = useNavigationMode()
  const partner = usePartnerStore()

  function scopedRoute(path: string): string {
    const id = scopedPartnerId.value ?? partner.effectivePartnerId
    if (id && isScope.value) return `/partners/${id}${path}`
    return path
  }

  function hubRoute(path: string): string {
    return path.replace(/^\/partners\/\d+/, '') || '/hub/dashboard'
  }

  async function enterPartner(id: number, name?: string) {
    if (name) partner.setPartner(id, name)
    await navigateTo(`/partners/${id}/dashboard`)
  }

  async function exitToHub() {
    partner.clearPartner()
    await navigateTo('/hub/dashboard')
  }

  return { scopedRoute, hubRoute, enterPartner, exitToHub }
}
