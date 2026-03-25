import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { UserFilters, UserFormData, UserPagination, UserRow } from '@/types/user'

export function useUsers() {
  const api = useApi()

  const users = ref<UserRow[]>([])
  const pagination = ref<UserPagination>({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<UserFilters>({})
  const sort = ref('-created_at')
  const perPage = ref(15)

  function mapUser(raw: Record<string, unknown>): UserRow {
    const partner = raw.partner as Record<string, unknown> | undefined
    return {
      id: Number(raw.id),
      firstname: String(raw.firstname ?? ''),
      lastname: String(raw.lastname ?? ''),
      full_name: String(raw.full_name ?? ''),
      email: String(raw.email ?? ''),
      partner_id: raw.partner_id != null ? Number(raw.partner_id) : null,
      partner_name: partner?.name != null ? String(partner.name) : undefined,
      roles: Array.isArray(raw.roles) ? raw.roles.map(String) : [],
      is_active: raw.is_active === true || raw.is_active === 'true' || raw.is_active === 1,
      created_at: String(raw.created_at ?? ''),
    }
  }

  async function fetchUsers(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const query: Record<string, unknown> = {
        sort: sort.value,
        page: pagination.value.page,
        per_page: perPage.value,
        include: 'partner',
      }

      if (filters.value.partner_id != null) {
        query['filter[partner_id]'] = filters.value.partner_id
      }
      if (filters.value.role) {
        query['filter[role]'] = filters.value.role
      }
      if (filters.value.search) {
        query['filter[search]'] = filters.value.search
      }
      if (filters.value.is_active !== null && filters.value.is_active !== undefined) {
        query['filter[is_active]'] = filters.value.is_active ? 1 : 0
      }

      const { data, error } = await api.GET('/users', {
        params: { query } as { query: Record<string, unknown> },
      })

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        users.value = raw.data.map(mapUser)
        pagination.value = {
          page: Number(raw.meta.current_page),
          lastPage: Number(raw.meta.last_page),
          total: Number(raw.meta.total),
        }
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function createUser(formData: UserFormData): Promise<UserRow | null> {
    const { data, error } = await api.POST('/users', {
      body: formData,
    } as never)

    if (error) return null

    const raw = (data as { data: Record<string, unknown> }).data
    return mapUser(raw)
  }

  async function updateUser(id: number, formData: Partial<UserFormData>): Promise<UserRow | null> {
    const { data, error } = await api.PUT('/users/{user}', {
      params: { path: { user: id } },
      body: formData,
    } as never)

    if (error) return null

    const raw = (data as { data: Record<string, unknown> }).data
    return mapUser(raw)
  }

  async function deleteUser(id: number): Promise<boolean> {
    const { error } = await api.DELETE('/users/{user}', {
      params: { path: { user: id } },
    } as never)
    return !error
  }

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchUsers()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }
    await fetchUsers()
  }

  function setFilters(f: Partial<UserFilters>): void {
    Object.assign(filters.value, f)
    pagination.value.page = 1
  }

  return {
    users,
    pagination,
    isLoading,
    hasError,
    filters,
    sort,
    perPage,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setPage,
    setSort,
    setFilters,
  }
}
