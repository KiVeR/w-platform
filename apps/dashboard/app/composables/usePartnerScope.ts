import { usePartnerStore } from '@/stores/partner'

export function usePartnerScope() {
  const partner = usePartnerStore()

  function withPartnerScope(params: Record<string, unknown> = {}): Record<string, unknown> {
    const id = partner.effectivePartnerId
    if (id === null) return params
    return { ...params, 'filter[partner_id]': id }
  }

  return { withPartnerScope }
}
