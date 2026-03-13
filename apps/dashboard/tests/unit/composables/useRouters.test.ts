import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({
    $api: {
      GET: mockGet,
      POST: mockPost,
      PUT: mockPut,
      DELETE: mockDelete,
    },
  })
  setActivePinia(createPinia())
})

const { useRouters } = await import('@/composables/useRouters')

describe('useRouters', () => {
  it('fetchRouters loads the list sorted query and maps counts', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: '9',
            name: 'Primary',
            external_id: '12',
            num_stop: '36063',
            is_active: 'true',
            partners_count: '2',
            campaigns_count: '5',
            created_at: '2026-03-13T10:00:00Z',
            updated_at: '2026-03-13T10:01:00Z',
          },
        ],
      },
      error: null,
    })

    const { routers, fetchRouters } = useRouters()
    await fetchRouters()

    expect(mockGet).toHaveBeenCalledWith('/routers', expect.objectContaining({
      params: { query: { sort: 'name' } },
    }))
    expect(routers.value[0]).toMatchObject({
      id: 9,
      name: 'Primary',
      external_id: 12,
      num_stop: '36063',
      is_active: true,
      partners_count: 2,
      campaigns_count: 5,
    })
  })

  it('createRouter posts the normalized payload and appends the router', async () => {
    mockPost.mockResolvedValue({
      data: {
        data: {
          id: 10,
          name: 'Backup',
          external_id: 13,
          num_stop: null,
          is_active: true,
          partners_count: 0,
          campaigns_count: 0,
          created_at: '2026-03-13T10:00:00Z',
          updated_at: '2026-03-13T10:00:00Z',
        },
      },
      error: null,
    })

    const { routers, createRouter } = useRouters()
    const created = await createRouter({
      name: ' Backup ',
      external_id: 13,
      num_stop: '',
      is_active: true,
    })

    expect(created).toBe(true)
    expect(mockPost).toHaveBeenCalledWith('/routers', expect.objectContaining({
      body: {
        name: 'Backup',
        external_id: 13,
        num_stop: null,
        is_active: true,
      },
    }))
    expect(routers.value[0].name).toBe('Backup')
  })

  it('updateRouter replaces the local router with the API response', async () => {
    mockPut.mockResolvedValue({
      data: {
        data: {
          id: 4,
          name: 'Primary v2',
          external_id: 44,
          num_stop: '36111',
          is_active: false,
          partners_count: 1,
          campaigns_count: 2,
          created_at: '2026-03-13T10:00:00Z',
          updated_at: '2026-03-13T10:05:00Z',
        },
      },
      error: null,
    })

    const { routers, updateRouter } = useRouters()
    routers.value = [{
      id: 4,
      name: 'Primary',
      external_id: 12,
      num_stop: '36063',
      is_active: true,
      partners_count: 0,
      campaigns_count: 0,
      created_at: '2026-03-13T10:00:00Z',
      updated_at: '2026-03-13T10:00:00Z',
    }]

    const updated = await updateRouter(4, {
      name: 'Primary v2',
      external_id: 44,
      num_stop: '36111',
      is_active: false,
    })

    expect(updated).toBe(true)
    expect(mockPut).toHaveBeenCalledWith('/routers/{router}', expect.objectContaining({
      params: { path: { router: 4 } },
    }))
    expect(routers.value[0]).toMatchObject({
      name: 'Primary v2',
      is_active: false,
      partners_count: 1,
    })
  })

  it('deleteRouter removes the router from local state on success', async () => {
    mockDelete.mockResolvedValue({ data: { message: 'Router deleted.' }, error: null, response: { status: 200 } })

    const { routers, deleteRouter } = useRouters()
    routers.value = [{
      id: 7,
      name: 'To delete',
      external_id: null,
      num_stop: null,
      is_active: true,
      partners_count: 0,
      campaigns_count: 0,
      created_at: null,
      updated_at: null,
    }]

    const deleted = await deleteRouter(7)

    expect(deleted).toBe(true)
    expect(routers.value).toHaveLength(0)
  })

  it('deleteRouter exposes a specific in_use error on 409', async () => {
    mockDelete.mockResolvedValue({
      data: null,
      error: { message: 'Router is in use. Disable it instead.' },
      response: { status: 409 },
    })

    const { deleteError, deleteRouter } = useRouters()
    const deleted = await deleteRouter(12)

    expect(deleted).toBe(false)
    expect(deleteError.value).toBe('in_use')
  })

  it('clearDeleteError resets the delete feedback', async () => {
    mockDelete.mockResolvedValue({
      data: null,
      error: { message: 'Router is in use. Disable it instead.' },
      response: { status: 409 },
    })

    const { deleteError, deleteRouter, clearDeleteError } = useRouters()
    await deleteRouter(12)

    expect(deleteError.value).toBe('in_use')

    clearDeleteError()

    expect(deleteError.value).toBeNull()
  })
})
