import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, POST: mockPost, DELETE: mockDelete } })
  setActivePinia(createPinia())
})

const { useTargetingTemplates } = await import('@/composables/useTargetingTemplates')

const fakeTemplate = {
  id: '1',
  partner_id: '42',
  name: 'Zone Dept 75',
  targeting_json: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null, gender: null, age_min: 25, age_max: 55 },
  usage_count: '3',
  last_used_at: '2026-02-10T10:00:00Z',
  is_preset: false,
  category: null,
  created_at: '2026-01-15T10:00:00Z',
}

const fakePreset = {
  id: '10',
  partner_id: null,
  name: 'Zone locale 2-3 km',
  targeting_json: { method: 'address', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: 2500, gender: null, age_min: 25, age_max: 55 },
  usage_count: '0',
  last_used_at: null,
  is_preset: true,
  category: 'commerce',
  created_at: '2026-01-01T00:00:00Z',
}

describe('useTargetingTemplates', () => {
  it('fetchTemplates calls GET /targeting-templates twice (partner + presets)', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { data: [fakeTemplate] } })
      .mockResolvedValueOnce({ data: { data: [fakePreset] } })

    const { templates, presets, fetchTemplates } = useTargetingTemplates()
    await fetchTemplates('commerce')

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(mockGet).toHaveBeenCalledWith('/targeting-templates', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ 'filter[is_preset]': 0 }),
      }),
    }))
    expect(mockGet).toHaveBeenCalledWith('/targeting-templates', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ 'filter[is_preset]': 1, 'filter[category]': 'commerce' }),
      }),
    }))
    expect(templates.value).toHaveLength(1)
    expect(presets.value).toHaveLength(1)
  })

  it('maps raw template to typed TargetingTemplateRow', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { data: [fakeTemplate] } })
      .mockResolvedValueOnce({ data: { data: [] } })

    const { templates, fetchTemplates } = useTargetingTemplates()
    await fetchTemplates()

    const tpl = templates.value[0]
    expect(tpl.id).toBe(1)
    expect(typeof tpl.id).toBe('number')
    expect(tpl.partner_id).toBe(42)
    expect(tpl.name).toBe('Zone Dept 75')
    expect(tpl.usage_count).toBe(3)
    expect(tpl.targeting_json.method).toBe('department')
    expect(tpl.is_preset).toBe(false)
  })

  it('fetchTemplates without activityType skips category filter on presets', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } })

    const { fetchTemplates } = useTargetingTemplates()
    await fetchTemplates()

    const presetCall = mockGet.mock.calls[1]
    const query = presetCall[1].params.query
    expect(query).not.toHaveProperty('filter[category]')
  })

  it('sets hasError on API error', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchTemplates } = useTargetingTemplates()
    await fetchTemplates()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('useTemplate calls POST /targeting-templates/{id}/use and returns targeting', async () => {
    mockPost.mockResolvedValue({
      data: { data: fakeTemplate },
    })

    const { useTemplate } = useTargetingTemplates()
    const targeting = await useTemplate(1)

    expect(mockPost).toHaveBeenCalledWith(
      '/targeting-templates/{targeting_template}/use',
      expect.objectContaining({
        params: { path: { targeting_template: 1 } },
      }),
    )
    expect(targeting).not.toBeNull()
    expect(targeting!.method).toBe('department')
    expect(targeting!.departments).toEqual(['75'])
  })

  it('useTemplate returns null on error', async () => {
    mockPost.mockResolvedValue({ data: undefined, error: { status: 404 } })

    const { useTemplate } = useTargetingTemplates()
    const targeting = await useTemplate(999)

    expect(targeting).toBeNull()
  })

  it('deleteTemplate calls DELETE and removes from local list', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { data: [fakeTemplate, { ...fakeTemplate, id: '2', name: 'Other' }] } })
      .mockResolvedValueOnce({ data: { data: [] } })
    mockDelete.mockResolvedValue({ error: null })

    const { templates, fetchTemplates, deleteTemplate } = useTargetingTemplates()
    await fetchTemplates()
    expect(templates.value).toHaveLength(2)

    const result = await deleteTemplate(1)
    expect(result).toBe(true)
    expect(templates.value).toHaveLength(1)
    expect(templates.value[0].id).toBe(2)
  })

  it('deleteTemplate returns false on error', async () => {
    mockDelete.mockResolvedValue({ error: { status: 500 } })

    const { deleteTemplate } = useTargetingTemplates()
    const result = await deleteTemplate(1)

    expect(result).toBe(false)
  })

  it('handles targeting_json as string (JSON)', async () => {
    const templateWithStringJson = {
      ...fakeTemplate,
      targeting_json: JSON.stringify(fakeTemplate.targeting_json),
    }
    mockGet
      .mockResolvedValueOnce({ data: { data: [templateWithStringJson] } })
      .mockResolvedValueOnce({ data: { data: [] } })

    const { templates, fetchTemplates } = useTargetingTemplates()
    await fetchTemplates()

    expect(templates.value[0].targeting_json.method).toBe('department')
  })
})
