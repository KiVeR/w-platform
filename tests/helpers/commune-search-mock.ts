import { ref } from 'vue'
import { vi } from 'vitest'
import type { CommuneSearchResult } from '#targeting/types/targeting'

export const mockCommuneResults = ref<CommuneSearchResult[]>([])
export const mockCommuneQuery = ref('')
export const mockIsSearching = ref(false)
export const mockClear = vi.fn()

export function resetCommuneSearchMock() {
  mockCommuneResults.value = []
  mockCommuneQuery.value = ''
  mockIsSearching.value = false
  mockClear.mockReset()
}
