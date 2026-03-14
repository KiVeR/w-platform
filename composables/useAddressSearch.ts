import { ref, watch } from 'vue'
import { fetchAddresses } from '#targeting/utils/geo-api'
import { createDebouncedFetcher } from '#targeting/utils/debounce-lifecycle'
import type { AddressResult } from '#targeting/types/targeting'

export function useAddressSearch() {
  const query = ref('')
  const results = ref<AddressResult[]>([])
  const isSearching = ref(false)
  const { schedule, cancel } = createDebouncedFetcher(300)

  watch(query, (val) => {
    cancel()

    if (val.length < 1) {
      results.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    schedule(async (signal) => {
      try {
        results.value = await fetchAddresses(val, signal)
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
