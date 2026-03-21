import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import type { Role, Permission } from '@/types/auth'

/**
 * Named middleware — opt-in per page via:
 *   definePageMeta({ middleware: ['role-guard'], requiredRoles: [...], requiredPermissions: [...] })
 *
 * Admin users bypass all role/permission checks.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const { can, hasAnyRole } = usePermission()

  const requiredRoles = to.meta.requiredRoles as Role[] | undefined
  const requiredPermissions = to.meta.requiredPermissions as Permission[] | undefined

  // Admin bypass — always allowed
  if (auth.isAdmin) return

  // Check roles
  if (requiredRoles?.length && !hasAnyRole(requiredRoles)) {
    return navigateTo(auth.defaultRoute)
  }

  // Check permissions — all listed permissions must be held
  if (requiredPermissions?.length) {
    const hasAll = requiredPermissions.every(p => can(p))
    if (!hasAll) {
      return navigateTo(auth.defaultRoute)
    }
  }
})
