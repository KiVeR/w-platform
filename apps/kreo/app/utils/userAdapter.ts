import type { UserPublic } from '#shared/types/user'

export interface PlatformUser {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
  roles: string[]
  partner_id?: number | null
}

function mapRole(roles: string[]): 'ADMIN' | 'EDITOR' | 'VIEWER' {
  if (roles.includes('admin') || roles.includes('partner')) return 'ADMIN'
  if (roles.includes('merchant') || roles.includes('employee')) return 'EDITOR'
  return 'VIEWER'
}

export function platformUserToKreoUser(user: PlatformUser): UserPublic {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstname,
    lastName: user.lastname,
    role: mapRole(user.roles),
  }
}
