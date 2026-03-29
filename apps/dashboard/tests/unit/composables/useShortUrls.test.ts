import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { useShortUrls } from '@/composables/useShortUrls'

const { mockDownloadCsv } = vi.hoisted(() => ({ mockDownloadCsv: vi.fn() }))
vi.mock('@/utils/exportCsv', () => ({ downloadCsv: mockDownloadCsv }))

const mockGet = vi.fn()
const mockDelete = vi.fn()

const fakeShortUrl = {
  id: '1',
  slug: 'promo-ete',
  link: 'https://example.com/promo',
  click_count: '42',
  click_count_bots: '3',
  is_draft: 'false',
  is_enabled: 'true',
  is_traceable_by_recipient: 'false',
  import_id: null,
}

function fakeShortUrlList(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    ...fakeShortUrl,
    id: String(i + 1),
    slug: `slug-${i + 1}`,
    click_count: String(i * 10),
  }))
}

const fakePaginationMeta = {
  current_page: 1,
  from: 1,
  last_page: 3,
  links: [],
  path: '/api/short-urls',
  per_page: 15,
  to: 15,
  total: 42,
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, DELETE: mockDelete } })
  setActivePinia(createPinia())
})

describe('useShortUrls', () => {
  test('fetchShortUrls appelle GET /short-urls et mappe data + pagination', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeShortUrlList(3), meta: fakePaginationMeta },
    })
    const { shortUrls, pagination, fetchShortUrls } = useShortUrls()
    await fetchShortUrls()
    expect(mockGet).toHaveBeenCalledWith('/short-urls', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ sort: '-id', page: 1 }),
      }),
    }))
    expect(shortUrls.value).toHaveLength(3)
    expect(pagination.value.total).toBe(42)
    expect(pagination.value.lastPage).toBe(3)
  })

  test('fetchShortUrls mappe snake_case vers camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: '5',
          slug: 'test-slug',
          link: 'https://example.com',
          click_count: '100',
          click_count_bots: '7',
          is_draft: 'true',
          is_enabled: 'false',
          is_traceable_by_recipient: 'true',
          import_id: 'import-abc',
        }],
        meta: fakePaginationMeta,
      },
    })
    const { shortUrls, fetchShortUrls } = useShortUrls()
    await fetchShortUrls()
    const row = shortUrls.value[0]
    expect(row.id).toBe(5)
    expect(row.slug).toBe('test-slug')
    expect(row.link).toBe('https://example.com')
    expect(row.clickCount).toBe(100)
    expect(row.clickCountBots).toBe(7)
    expect(row.isDraft).toBe(true)
    expect(row.isEnabled).toBe(false)
    expect(row.isTraceable).toBe(true)
    expect(row.importId).toBe('import-abc')
  })

  test('fetchShortUrls passe les query params de filtrage (search)', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })
    const { filters, fetchShortUrls } = useShortUrls()
    filters.value.search = 'promo'
    await fetchShortUrls()
    expect(mockGet).toHaveBeenCalledWith('/short-urls', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ search: 'promo' }),
      }),
    }))
  })

  test('fetchShortUrls passe is_enabled quand filtre != all', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })
    const { filters, fetchShortUrls } = useShortUrls()
    filters.value.isEnabled = 'true'
    await fetchShortUrls()
    expect(mockGet).toHaveBeenCalledWith('/short-urls', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ is_enabled: true }),
      }),
    }))
  })

  test('fetchShortUrls n\'envoie pas is_enabled quand filtre vaut all', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })
    const { filters, fetchShortUrls } = useShortUrls()
    filters.value.isEnabled = 'all'
    await fetchShortUrls()
    const callArgs = mockGet.mock.calls[0]
    expect(callArgs[1].params.query).not.toHaveProperty('is_enabled')
  })

  test('setPage change la page et re-fetch', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeShortUrlList(2), meta: { ...fakePaginationMeta, current_page: 2 } },
    })
    const { pagination, setPage } = useShortUrls()
    await setPage(2)
    expect(pagination.value.page).toBe(2)
    expect(mockGet).toHaveBeenCalledWith('/short-urls', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 2 }),
      }),
    }))
  })

  test('setSort inverse le tri quand le meme champ est selectionne', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakePaginationMeta },
    })
    const { sort, setSort } = useShortUrls()
    expect(sort.value).toBe('-id')
    await setSort('id')
    expect(sort.value).toBe('id')
    await setSort('id')
    expect(sort.value).toBe('-id')
  })

  test('setSort passe sur un nouveau champ avec tri descendant', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakePaginationMeta },
    })
    const { sort, setSort } = useShortUrls()
    await setSort('slug')
    expect(sort.value).toBe('-slug')
  })

  test('setSort declenche un re-fetch', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakePaginationMeta },
    })
    const { setSort } = useShortUrls()
    await setSort('slug')
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  test('setFilters met a jour les filtres et reset page a 1', async () => {
    const { filters, pagination, setFilters } = useShortUrls()
    pagination.value.page = 3
    setFilters({ search: 'test', isEnabled: 'false' })
    expect(filters.value.search).toBe('test')
    expect(filters.value.isEnabled).toBe('false')
    expect(pagination.value.page).toBe(1)
  })

  test('deleteShortUrl appelle DELETE /short-urls/{shortUrl} et retourne true', async () => {
    mockDelete.mockResolvedValue({ error: null })
    const { deleteShortUrl } = useShortUrls()
    const result = await deleteShortUrl(7)
    expect(mockDelete).toHaveBeenCalledWith('/short-urls/{shortUrl}', expect.objectContaining({
      params: expect.objectContaining({
        path: expect.objectContaining({ shortUrl: 7 }),
      }),
    }))
    expect(result).toBe(true)
  })

  test('deleteShortUrl retourne false en cas d\'erreur', async () => {
    mockDelete.mockResolvedValue({ error: { message: 'Not found' } })
    const { deleteShortUrl } = useShortUrls()
    const result = await deleteShortUrl(99)
    expect(result).toBe(false)
  })

  test('fetchShortUrls met hasError a true en cas d\'erreur API', async () => {
    mockGet.mockResolvedValue({ error: { message: 'Server error' } })
    const { hasError, fetchShortUrls } = useShortUrls()
    await fetchShortUrls()
    expect(hasError.value).toBe(true)
  })

  test('fetchShortUrls met hasError a true en cas d\'exception', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))
    const { hasError, fetchShortUrls } = useShortUrls()
    await fetchShortUrls()
    expect(hasError.value).toBe(true)
  })

  test('fetchShortUrls met isLoading a false apres chargement', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakePaginationMeta },
    })
    const { isLoading, fetchShortUrls } = useShortUrls()
    await fetchShortUrls()
    expect(isLoading.value).toBe(false)
  })

  test('exportCsv fetche toutes les pages et appelle downloadCsv', async () => {
    const page1Meta = { ...fakePaginationMeta, current_page: 1, last_page: 2 }
    const page2Meta = { ...fakePaginationMeta, current_page: 2, last_page: 2 }
    mockGet
      .mockResolvedValueOnce({ data: { data: fakeShortUrlList(2), meta: page1Meta } })
      .mockResolvedValueOnce({ data: { data: fakeShortUrlList(1), meta: page2Meta } })

    const { exportCsv, isExporting } = useShortUrls()
    expect(isExporting.value).toBe(false)
    const exportPromise = exportCsv()
    await exportPromise
    expect(isExporting.value).toBe(false)
    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(mockDownloadCsv).toHaveBeenCalledOnce()
    expect(mockDownloadCsv).toHaveBeenCalledWith(
      'short-urls-export.csv',
      ['Slug', 'URL destination', 'Clics humains', 'Clics bots', 'Statut', 'Traçable'],
      expect.arrayContaining([
        expect.arrayContaining(['slug-1']),
      ]),
    )
    const rows: string[][] = mockDownloadCsv.mock.calls[0][2]
    expect(rows).toHaveLength(3)
  })

  test('exportCsv met isExporting a false apres echec', async () => {
    mockGet.mockResolvedValue({ error: { message: 'fail' } })
    const { exportCsv, isExporting } = useShortUrls()
    await exportCsv()
    expect(isExporting.value).toBe(false)
    expect(mockDownloadCsv).toHaveBeenCalledWith(
      'short-urls-export.csv',
      expect.any(Array),
      [],
    )
  })
})
