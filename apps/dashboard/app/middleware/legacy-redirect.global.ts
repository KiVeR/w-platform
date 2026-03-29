import { useAuthStore } from '@/stores/auth'

/**
 * Legacy redirect middleware.
 *
 * Routes that require a partner context to function.
 * /demandes and /operations are NOT in this list because they work
 * in Hub mode via Demande::forUser() / Operation::forUser() (global listing).
 */
const SCOPED_ROUTES = ['/campaigns', '/shops', '/landing-pages']

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore(usePinia())

  // Only redirect internal roles on flat routes (partner-bound keep existing behavior)
  if (auth.isPartnerBound) return

  // Not authenticated yet — let auth middleware handle it
  if (!auth.isAuthenticated) return

  // Check if the route is a flat scoped route (needs partner context)
  const isFlat = SCOPED_ROUTES.some(r => to.path === r || to.path.startsWith(r + '/'))
  if (!isFlat) return

  // Already in scope mode → pass through
  if (to.path.startsWith('/partners/')) return

  // Redirect to Hub (they need to pick a partner first)
  return navigateTo('/hub/dashboard')
})
