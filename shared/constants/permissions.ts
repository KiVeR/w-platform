export const PERMISSIONS = {
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  MANAGE: 'MANAGE',
} as const

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const PERMISSION_HIERARCHY: Record<PermissionType, number> = {
  VIEW: 1,
  EDIT: 2,
  MANAGE: 3,
}

export function hasMinimumPermission(
  userPermission: PermissionType,
  requiredPermission: PermissionType,
): boolean {
  return PERMISSION_HIERARCHY[userPermission] >= PERMISSION_HIERARCHY[requiredPermission]
}
