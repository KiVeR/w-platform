import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser, fakeUser } from '../../helpers/fixtures'

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

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')
const { useVariableSchemas } = await import('@/composables/useVariableSchemas')

describe('useVariableSchemas', () => {
  it('fetchSchemas calls GET with includes and partner scope', async () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    const partnerStore = usePartnerStore()
    partnerStore.setPartner(42, 'Test Partner')

    mockGet.mockResolvedValue({
      data: { data: [] },
      error: null,
    })

    const { fetchSchemas } = useVariableSchemas()
    await fetchSchemas()

    expect(mockGet).toHaveBeenCalledWith('/variable-schemas', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          include: 'partner,variableFields',
          'filter[partner_id]': 42,
        }),
      }),
    }))
  })

  it('maps fetchSchemas response to typed schemas', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: '5',
            uuid: 'schema-uuid',
            partner_id: '42',
            name: 'My Schema',
            global_data: { sender: 'WELLPACK' },
            recipient_preview_data: { prenom: 'Jean' },
            fields: [
              { id: '7', name: 'prenom', is_used: true, is_global: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
            ],
            partner: { id: '42', name: 'Test Partner' },
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
          },
        ],
      },
      error: null,
    })

    const { schemas, fetchSchemas } = useVariableSchemas()
    await fetchSchemas()

    expect(schemas.value).toHaveLength(1)
    expect(schemas.value[0]).toMatchObject({
      id: 5,
      uuid: 'schema-uuid',
      partner_id: 42,
      name: 'My Schema',
      partner: { id: 42, name: 'Test Partner' },
    })
    expect(schemas.value[0].fields[0]).toMatchObject({
      id: 7,
      name: 'prenom',
      is_used: true,
      is_global: false,
    })
  })

  it('fetchSchema stores the current schema', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: {
          id: 9,
          uuid: 'show-uuid',
          partner_id: 42,
          name: 'Detail Schema',
          global_data: null,
          recipient_preview_data: null,
          fields: [],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
      error: null,
    })

    const { current, fetchSchema } = useVariableSchemas()
    const result = await fetchSchema('show-uuid')

    expect(mockGet).toHaveBeenCalledWith('/variable-schemas/{variableSchema}', expect.objectContaining({
      params: {
        path: { variableSchema: 'show-uuid' },
        query: { include: 'partner,variableFields' },
      },
    }))
    expect(result?.uuid).toBe('show-uuid')
    expect(current.value?.name).toBe('Detail Schema')
  })

  it('createSchema posts normalized payload with partner_id for admin', async () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    mockPost.mockResolvedValue({
      data: {
        data: {
          id: 1,
          uuid: 'created-uuid',
          partner_id: 42,
          name: 'Created schema',
          global_data: null,
          recipient_preview_data: null,
          fields: [],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
      error: null,
    })

    const { createSchema } = useVariableSchemas()
    await createSchema({
      partner_id: 42,
      name: 'Created schema',
      global_data: null,
      recipient_preview_data: null,
      fields: [{ name: 'prenom', is_used: false, is_global: false }],
    })

    expect(mockPost).toHaveBeenCalledWith('/variable-schemas', expect.objectContaining({
      body: {
        partner_id: 42,
        name: 'Created schema',
        global_data: null,
        recipient_preview_data: null,
        fields: [{ name: 'prenom', is_global: false }],
      },
    }))
  })

  it('deleteSchema calls DELETE and removes the schema from local state', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 2,
            uuid: 'delete-uuid',
            partner_id: 42,
            name: 'Delete me',
            global_data: null,
            recipient_preview_data: null,
            fields: [],
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
      },
      error: null,
    })
    mockDelete.mockResolvedValue({ data: { message: 'Variable schema deleted.' }, error: null })

    const { schemas, fetchSchemas, deleteSchema } = useVariableSchemas()
    await fetchSchemas()
    const deleted = await deleteSchema('delete-uuid')

    expect(deleted).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith('/variable-schemas/{variableSchema}', expect.objectContaining({
      params: { path: { variableSchema: 'delete-uuid' } },
    }))
    expect(schemas.value).toHaveLength(0)
  })

  it('cloneSchema calls clone endpoint and prepends the clone', async () => {
    mockPost.mockResolvedValue({
      data: {
        data: {
          id: 3,
          uuid: 'clone-uuid',
          partner_id: 42,
          name: 'Original (copy)',
          global_data: null,
          recipient_preview_data: null,
          fields: [],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
      error: null,
    })

    const { schemas, cloneSchema } = useVariableSchemas()
    schemas.value = [{
      id: 2,
      uuid: 'original-uuid',
      partner_id: 42,
      name: 'Original',
      global_data: null,
      recipient_preview_data: null,
      fields: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      partner: null,
    }]

    const clone = await cloneSchema('original-uuid')

    expect(mockPost).toHaveBeenCalledWith('/variable-schemas/{variableSchema}/clone', expect.objectContaining({
      params: { path: { variableSchema: 'original-uuid' } },
    }))
    expect(clone?.uuid).toBe('clone-uuid')
    expect(schemas.value[0].uuid).toBe('clone-uuid')
  })

  it('discoverFromCsv returns not_implemented on 501', async () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

    mockPost.mockResolvedValue({
      data: null,
      error: { status: 501 },
    })

    const { discoverFromCsv } = useVariableSchemas()
    const result = await discoverFromCsv('Imported schema', new File(['a,b'], 'schema.csv', { type: 'text/csv' }))

    expect(result).toBe('not_implemented')
  })
})
