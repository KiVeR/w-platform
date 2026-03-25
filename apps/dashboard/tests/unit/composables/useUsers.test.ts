import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { useUsers } from '@/composables/useUsers'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, POST: mockPost, PUT: mockPut, DELETE: mockDelete } })
  setActivePinia(createPinia())
})

function fakeUserRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    firstname: 'Jean',
    lastname: 'Dupont',
    full_name: 'Jean Dupont',
    email: 'jean@test.com',
    partner_id: '42',
    roles: ['partner'],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    partner: { id: 42, name: 'Partenaire Test' },
    ...overrides,
  }
}

function fakeUserList(count = 3) {
  return Array.from({ length: count }, (_, i) => fakeUserRow({
    id: String(i + 1),
    firstname: `User${i + 1}`,
    email: `user${i + 1}@test.com`,
  }))
}

const fakePaginationMeta = {
  current_page: 1,
  from: 1,
  last_page: 2,
  links: [],
  path: '/api/users',
  per_page: 15,
  to: 15,
  total: 25,
}

describe('useUsers', () => {
  test('fetchUsers calls GET /users and maps data + pagination', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeUserList(3), meta: fakePaginationMeta },
    })

    const { users, pagination, fetchUsers } = useUsers()
    await fetchUsers()

    expect(mockGet).toHaveBeenCalledWith('/users', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          sort: '-created_at',
          page: 1,
          per_page: 15,
          include: 'partner',
        }),
      }),
    }))
    expect(users.value).toHaveLength(3)
    expect(users.value[0].id).toBe(1)
    expect(users.value[0].firstname).toBe('User1')
    expect(users.value[0].partner_name).toBe('Partenaire Test')
    expect(pagination.value.total).toBe(25)
    expect(pagination.value.lastPage).toBe(2)
  })

  test('fetchUsers passes partner_id filter', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchUsers } = useUsers()
    setFilters({ partner_id: 42 })
    await fetchUsers()

    expect(mockGet).toHaveBeenCalledWith('/users', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[partner_id]': 42,
        }),
      }),
    }))
  })

  test('fetchUsers passes role filter', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchUsers } = useUsers()
    setFilters({ role: 'partner' })
    await fetchUsers()

    expect(mockGet).toHaveBeenCalledWith('/users', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[role]': 'partner',
        }),
      }),
    }))
  })

  test('fetchUsers passes search filter', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchUsers } = useUsers()
    setFilters({ search: 'Dupont' })
    await fetchUsers()

    expect(mockGet).toHaveBeenCalledWith('/users', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[search]': 'Dupont',
        }),
      }),
    }))
  })

  test('fetchUsers passes is_active filter', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchUsers } = useUsers()
    setFilters({ is_active: true })
    await fetchUsers()

    expect(mockGet).toHaveBeenCalledWith('/users', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[is_active]': 1,
        }),
      }),
    }))
  })

  test('fetchUsers does not include is_active filter when null', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchUsers } = useUsers()
    setFilters({ is_active: null })
    await fetchUsers()

    const callArgs = mockGet.mock.calls[0][1]
    expect(callArgs.params.query).not.toHaveProperty('filter[is_active]')
  })

  test('setPage changes the page and re-fetches', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, current_page: 2 } },
    })

    const { pagination, setPage } = useUsers()
    await setPage(2)

    expect(pagination.value.page).toBe(2)
    expect(mockGet).toHaveBeenCalledWith('/users', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 2 }),
      }),
    }))
  })

  test('setSort toggles desc/asc and re-fetches', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakePaginationMeta },
    })

    const { sort, setSort } = useUsers()
    expect(sort.value).toBe('-created_at')

    await setSort('created_at')
    expect(sort.value).toBe('created_at')

    await setSort('created_at')
    expect(sort.value).toBe('-created_at')

    await setSort('firstname')
    expect(sort.value).toBe('-firstname')
  })

  test('fetchUsers sets hasError when API returns an error', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchUsers } = useUsers()
    await fetchUsers()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  test('createUser calls POST /users and returns mapped user', async () => {
    mockPost.mockResolvedValue({
      data: { data: fakeUserRow() },
    })

    const { createUser } = useUsers()
    const result = await createUser({
      firstname: 'Jean',
      lastname: 'Dupont',
      email: 'jean@test.com',
      password: 'secret123',
      role: 'partner',
      partner_id: 42,
    })

    expect(mockPost).toHaveBeenCalledWith('/users', expect.objectContaining({
      body: expect.objectContaining({
        firstname: 'Jean',
        email: 'jean@test.com',
      }),
    }))
    expect(result).not.toBeNull()
    expect(result!.id).toBe(1)
    expect(result!.firstname).toBe('Jean')
  })

  test('createUser returns null on error', async () => {
    mockPost.mockResolvedValue({ data: undefined, error: { status: 422 } })

    const { createUser } = useUsers()
    const result = await createUser({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@test.com',
    })

    expect(result).toBeNull()
  })

  test('updateUser calls PUT /users/{user} and returns mapped user', async () => {
    mockPut.mockResolvedValue({
      data: { data: fakeUserRow({ firstname: 'Updated' }) },
    })

    const { updateUser } = useUsers()
    const result = await updateUser(1, { firstname: 'Updated' })

    expect(mockPut).toHaveBeenCalledWith('/users/{user}', expect.objectContaining({
      params: { path: { user: 1 } },
      body: { firstname: 'Updated' },
    }))
    expect(result).not.toBeNull()
    expect(result!.firstname).toBe('Updated')
  })

  test('updateUser returns null on error', async () => {
    mockPut.mockResolvedValue({ data: undefined, error: { status: 403 } })

    const { updateUser } = useUsers()
    const result = await updateUser(999, { firstname: 'Test' })

    expect(result).toBeNull()
  })

  test('deleteUser calls DELETE and returns true on success', async () => {
    mockDelete.mockResolvedValue({ data: {}, error: undefined })

    const { deleteUser } = useUsers()
    const result = await deleteUser(1)

    expect(mockDelete).toHaveBeenCalledWith('/users/{user}', {
      params: { path: { user: 1 } },
    })
    expect(result).toBe(true)
  })

  test('deleteUser returns false on error', async () => {
    mockDelete.mockResolvedValue({ data: undefined, error: { status: 403 } })

    const { deleteUser } = useUsers()
    const result = await deleteUser(999)

    expect(result).toBe(false)
  })

  test('setFilters resets page to 1', () => {
    const { filters, pagination, setFilters } = useUsers()
    pagination.value.page = 3
    setFilters({ search: 'Test' })

    expect(filters.value.search).toBe('Test')
    expect(pagination.value.page).toBe(1)
  })

  test('maps null partner correctly', async () => {
    const userRow = fakeUserRow({ partner_id: null, partner: undefined })
    mockGet.mockResolvedValue({
      data: { data: [userRow], meta: fakePaginationMeta },
    })

    const { users, fetchUsers } = useUsers()
    await fetchUsers()

    expect(users.value[0].partner_id).toBeNull()
    expect(users.value[0].partner_name).toBeUndefined()
  })
})
