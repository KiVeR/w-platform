export interface UserRow {
  id: number
  firstname: string
  lastname: string
  full_name: string
  email: string
  partner_id: number | null
  partner_name?: string
  roles: string[]
  is_active: boolean
  created_at: string
}

export interface UserFormData {
  firstname: string
  lastname: string
  email: string
  password?: string
  partner_id?: number | null
  role?: string
  is_active?: boolean
}

export interface UserFilters {
  partner_id?: number | null
  role?: string | null
  search?: string
  is_active?: boolean | null
}

export interface UserPagination {
  page: number
  lastPage: number
  total: number
}
