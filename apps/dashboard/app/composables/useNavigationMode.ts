import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { NavigationMode } from '@/types/navigation'

export function useNavigationMode() {
  const route = useRoute()
  const auth = useAuthStore()

  const scopedPartnerId = computed<number | null>(() => {
    const id = route.params.id as string | undefined
    if (id && route.path.startsWith('/partners/')) return Number(id)
    return null
  })

  const mode = computed<NavigationMode>(() => {
    // Partner-bound roles (partner, merchant, employee) are always in scope
    if (auth.isPartnerBound) return 'scope'
    // Internal roles enter scope only when URL contains /partners/:id
    if (scopedPartnerId.value !== null) return 'scope'
    return 'hub'
  })

  const isHub = computed(() => mode.value === 'hub')
  const isScope = computed(() => mode.value === 'scope')

  return { mode, isHub, isScope, scopedPartnerId }
}
