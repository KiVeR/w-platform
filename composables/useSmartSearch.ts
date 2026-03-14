import { ref, computed, watch } from 'vue'
import departments from '#targeting/data/departments.json'
import { fetchAddresses, fetchMunicipalities } from '#targeting/utils/geo-api'
import { createDebouncedFetcher } from '#targeting/utils/debounce-lifecycle'
import type { SmartSearchResult } from '#targeting/types/targeting'

interface DepartmentEntry {
  code: string
  name: string
}

const deptList = departments as DepartmentEntry[]

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
}

function filterDepartments(query: string): SmartSearchResult[] {
  const normalized = normalizeForSearch(query)
  return deptList
    .filter(d =>
      d.code.startsWith(normalized)
      || normalizeForSearch(d.name).includes(normalized),
    )
    .slice(0, 5)
    .map(d => ({
      type: 'department' as const,
      label: `${d.code} — ${d.name}`,
      departmentCode: d.code,
      departmentName: d.name,
    }))
}

async function searchAddresses(query: string, signal: AbortSignal): Promise<SmartSearchResult[]> {
  const results = await fetchAddresses(query, signal)
  return results.map(r => ({ type: 'address' as const, label: r.label, lat: r.lat, lng: r.lng }))
}

function detectInputCategory(input: string): 'postcode' | 'department_code' | 'general' {
  const trimmed = input.trim()
  if (/^\d{5}$/.test(trimmed)) return 'postcode'
  if (/^\d{1,4}$/.test(trimmed)) return 'department_code'
  return 'general'
}

export function useSmartSearch() {
  const query = ref('')
  const departmentResults = ref<SmartSearchResult[]>([])
  const addressResults = ref<SmartSearchResult[]>([])
  const postcodeResults = ref<SmartSearchResult[]>([])
  const isSearching = ref(false)
  const { schedule, cancel } = createDebouncedFetcher(300)

  const groupedResults = computed(() => ({
    departments: departmentResults.value,
    postcodes: postcodeResults.value,
    addresses: addressResults.value,
  }))

  const hasResults = computed(() =>
    departmentResults.value.length > 0
    || addressResults.value.length > 0
    || postcodeResults.value.length > 0,
  )

  watch(query, (val) => {
    cancel()

    if (val.trim().length < 1) {
      departmentResults.value = []
      addressResults.value = []
      postcodeResults.value = []
      isSearching.value = false
      return
    }

    // Department filtering is instant (local)
    departmentResults.value = filterDepartments(val.trim())

    // API searches are debounced
    isSearching.value = true
    schedule(async (signal) => {
      const category = detectInputCategory(val.trim())

      try {
        const promises: Promise<void>[] = []

        if (category === 'general' || category === 'postcode') {
          promises.push(
            searchAddresses(val.trim(), signal).then((r) => { addressResults.value = r }),
          )
        }

        if (category === 'postcode' || category === 'department_code') {
          promises.push(
            fetchMunicipalities(val.trim(), signal).then((r) => { postcodeResults.value = r }),
          )
        }
        else if (category === 'general') {
          postcodeResults.value = []
        }

        await Promise.all(promises)
      }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
        addressResults.value = []
        postcodeResults.value = []
      }
      finally {
        isSearching.value = false
      }
    })
  })

  function clear() {
    query.value = ''
    departmentResults.value = []
    addressResults.value = []
    postcodeResults.value = []
  }

  return {
    query,
    isSearching,
    groupedResults,
    hasResults,
    clear,
  }
}
