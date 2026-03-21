import type { components } from './api'

export type Role = 'admin' | 'partner' | 'merchant' | 'employee'
  | 'adv' | 'programmer' | 'graphiste' | 'marketing_manager' | 'direction' | 'commercial'
export type Permission = 'view partners' | 'manage partners' | 'view users' | 'manage users'
  | 'view campaigns' | 'manage campaigns' | 'view shops' | 'manage shops'
  | 'view landing-pages' | 'manage landing-pages'
  | 'view targeting-templates' | 'manage targeting-templates'
  | 'view variable-schemas' | 'manage variable-schemas'
  | 'view ai-contents' | 'manage ai-contents'
  | 'view demandes' | 'manage demandes'
  | 'view operations' | 'manage operations' | 'transition operations'

export interface AuthUser {
  id: number
  firstname: string
  lastname: string
  full_name: string
  email: string
  partner_id: number | null
  is_active: boolean
  created_at: string | null
  roles: Role[]
  permissions: Permission[]
  partner?: components['schemas']['PartnerResource']
}
