import { ref, watch } from 'vue'
import { isValidCommuneQuery } from '#targeting/utils/commune-validation'
import { createLruCache } from '#targeting/utils/lru-cache'
import { createDebouncedFetcher } from '#targeting/utils/debounce-lifecycle'
import type { CommuneSearchResult } from '#targeting/types/targeting'

const cache = createLruCache<CommuneSearchResult[]>(200)

export function useCommuneSearch() {
  const query = ref('')
  const results = ref<CommuneSearchResult[]>([])
  const isSearching = ref(false)
  const { schedule, cancel } = createDebouncedFetcher(300)

  function buildUrl(trimmed: string): string {
    const fields = 'fields=nom,code,codesPostaux,population'
    if (/^\d{5}$/.test(trimmed)) {
      return `https://geo.api.gouv.fr/communes?code=${trimmed}&${fields}`
    }
    if (/^\d{2,4}$/.test(trimmed)) {
      const dept = trimmed.slice(0, 2)
      return `https://geo.api.gouv.fr/communes?codeDepartement=${dept}&${fields}`
    }
    return `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(trimmed)}&${fields}&limit=10`
  }

  watch(query, (q) => {
    cancel()
    const trimmed = q.trim()

    if (!isValidCommuneQuery(trimmed)) {
      results.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    schedule(async (signal) => {
      const cached = cache.get(trimmed.toLowerCase())
      if (cached) {
        results.value = cached
        isSearching.value = false
        return
      }

      try {
        const response = await fetch(buildUrl(trimmed), { signal })
        if (!response.ok) {
          results.value = []
          isSearching.value = false
          return
        }
        let data: CommuneSearchResult[] = await response.json()
        // For partial numeric codes (3-4 digits), filter by prefix
        if (/^\d{3,4}$/.test(trimmed)) {
          data = data.filter(c => c.code.startsWith(trimmed))
        }
        data = data.slice(0, 10)
        cache.set(trimmed.toLowerCase(), data)
        results.value = data
      }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
        results.value = []
      }
      finally {
        isSearching.value = false
      }
    })
  })

  function clear() {
    query.value = ''
    results.value = []
  }

  return { query, results, isSearching, clear }
}
