import type { RoleType } from '../constants/roles'

export interface User {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: RoleType
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPublic {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: RoleType
}

export interface AuthUser extends UserPublic {
  // JWT payload user
}
