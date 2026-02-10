import { useAuthStore } from '@/stores/auth'
import type { Permission, Role } from '@/types/auth'

export function usePermission() {
  const auth = useAuthStore()

  function can(permission: Permission): boolean {
    return auth.user?.permissions.includes(permission) ?? false
  }

  function hasRole(role: Role): boolean {
    return auth.user?.roles.includes(role) ?? false
  }

  function hasAnyRole(roles: Role[]): boolean {
    return roles.some(r => hasRole(r))
  }

  return { can, hasRole, hasAnyRole }
}
