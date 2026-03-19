export const ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const

export type RoleType = typeof ROLES[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<RoleType, number> = {
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
}

export function hasMinimumRole(userRole: RoleType, requiredRole: RoleType): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
