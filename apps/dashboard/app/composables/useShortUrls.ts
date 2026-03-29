import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { downloadCsv } from '@/utils/exportCsv'
import { mapShortUrlToRow } from '@/utils/shortUrlMapper'
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

  const mapShortUrl = mapShortUrlToRow

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

  async function exportCsv(headers: { slug: string, link: string, clicks: string, bots: string, status: string, traceable: string, active: string, inactive: string, yes: string, no: string }): Promise<void> {
    isExporting.value = true
    try {
      const allRows: ShortUrlRow[] = []
      let page = 1
      let hasMore = true
      while (hasMore) {
        const query: Record<string, unknown> = { page, perPage: '100' }
        if (filters.value.search) query.search = filters.value.search
        if (filters.value.isEnabled !== 'all') query.is_enabled = filters.value.isEnabled === 'true'
        const { data, error } = await api.GET('/short-urls', {
          params: { query },
        } as never)
        if (error || !data) break
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        allRows.push(...raw.data.map(mapShortUrl))
        hasMore = page < Number(raw.meta.last_page ?? 1)
        page++
      }
      if (allRows.length === 0) return
      downloadCsv(
        'short-urls-export.csv',
        [headers.slug, headers.link, headers.clicks, headers.bots, headers.status, headers.traceable],
        allRows.map(row => [
          row.slug,
          row.link ?? '',
          String(row.clickCount),
          String(row.clickCountBots),
          row.isEnabled ? headers.active : headers.inactive,
          row.isTraceable ? headers.yes : headers.no,
        ]),
      )
    }
    finally { isExporting.value = false }
  }

  return { shortUrls, pagination, isLoading, hasError, filters, sort, isExporting, fetchShortUrls, deleteShortUrl, setPage, setSort, setFilters, exportCsv }
}
