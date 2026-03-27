import { useAuthStore } from '@/stores/auth'

/**
 * Named middleware: verifies the user has access to the scoped partner.
 * Delegates authorization to the API — PartnerPolicy handles role-based access.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore(usePinia())
  const partnerId = Number(to.params.id)

  if (!partnerId || isNaN(partnerId)) {
    return navigateTo(auth.defaultRoute)
  }

  // Partner-bound users: fast path, only their own partner
  if (auth.isPartnerBound) {
    if (auth.partnerId === partnerId) return
    return navigateTo(auth.defaultRoute)
  }

  // Internal roles: delegate access check to API (PartnerPolicy)
  const api = useNuxtApp().$api
  const { error } = await api.GET('/partners/{partner}', {
    params: { path: { partner: partnerId } },
  })

  if (!error) return

  // 403/404 — redirect to Hub
  return navigateTo(auth.defaultRoute)
})
