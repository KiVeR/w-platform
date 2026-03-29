import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { downloadCsv } from '@/utils/exportCsv'
import type { ShortUrlFilters, ShortUrlPagination, ShortUrlRow } from '@/types/shortUrl'

export function useShortUrls() {
  const api = useApi()

  const shortUrls = ref<ShortUrlRow[]>([])
  const pagination = ref<ShortUrlPagination>({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<ShortUrlFilters>({ search: '', isEnabled: 'all' })
  const sort = ref('-id')
  const isExporting = ref(false)

  function mapShortUrl(raw: Record<string, unknown>): ShortUrlRow {
    return {
      id: Number(raw.id),
      slug: String(raw.slug ?? ''),
      link: raw.link ? String(raw.link) : null,
      clickCount: Number(raw.click_count ?? 0),
      clickCountBots: Number(raw.click_count_bots ?? 0),
      isDraft: raw.is_draft === 'true' || raw.is_draft === true,
      isEnabled: raw.is_enabled === 'true' || raw.is_enabled === true,
      isTraceable: raw.is_traceable_by_recipient === 'true' || raw.is_traceable_by_recipient === true,
      importId: raw.import_id ? String(raw.import_id) : null,
    }
  }

  async function fetchShortUrls(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const query: Record<string, unknown> = {
        sort: sort.value,
        page: pagination.value.page,
      }
      if (filters.value.search) {
        query.search = filters.value.search
      }
      if (filters.value.isEnabled !== 'all') {
        query.is_enabled = filters.value.isEnabled === 'true'
      }

      const { data, error } = await api.GET('/short-urls', {
        params: { query },
      } as never)
      if (error) { hasError.value = true; return }
      if (data) {
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        shortUrls.value = raw.data.map(mapShortUrl)
        pagination.value = {
          page: Number(raw.meta.current_page),
          lastPage: Number(raw.meta.last_page),
          total: Number(raw.meta.total),
        }
      }
    }
    catch { hasError.value = true }
    finally { isLoading.value = false }
  }

  async function deleteShortUrl(id: number): Promise<boolean> {
    const { error } = await api.DELETE('/short-urls/{shortUrl}', {
      params: { path: { shortUrl: id } },
    } as never)
    return !error
  }

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchShortUrls()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }
    await fetchShortUrls()
  }

  function setFilters(f: Partial<ShortUrlFilters>): void {
    Object.assign(filters.value, f)
    pagination.value.page = 1
  }

  async function exportCsv(): Promise<void> {
    isExporting.value = true
    try {
      const allRows: ShortUrlRow[] = []
      let page = 1
      let hasMore = true
      while (hasMore) {
        const { data, error } = await api.GET('/short-urls', {
          params: { query: { page, perPage: '100' } },
        } as never)
        if (error || !data) break
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        allRows.push(...raw.data.map(mapShortUrl))
        hasMore = page < Number(raw.meta.last_page ?? 1)
        page++
      }
      downloadCsv(
        'short-urls-export.csv',
        ['Slug', 'URL destination', 'Clics humains', 'Clics bots', 'Statut', 'Traçable'],
        allRows.map(row => [
          row.slug,
          row.link ?? '',
          String(row.clickCount),
          String(row.clickCountBots),
          row.isEnabled ? 'Actif' : 'Inactif',
          row.isTraceable ? 'Oui' : 'Non',
        ]),
      )
    }
    finally { isExporting.value = false }
  }

  return { shortUrls, pagination, isLoading, hasError, filters, sort, isExporting, fetchShortUrls, deleteShortUrl, setPage, setSort, setFilters, exportCsv }
}
