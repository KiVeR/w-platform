import { ref } from 'vue'
import { useCommuneSearch } from './useCommuneSearch'
import { useDropdownKeyboard } from './useDropdownKeyboard'
import { isValidCommuneQuery } from '@/utils/commune-validation'
import type { CommuneSearchResult } from '@/types/targeting'

export function useGeoSearchInput(onSelect: (commune: CommuneSearchResult) => void) {
  const inputValue = ref('')
  const showDropdown = ref(false)
  const { query, results, isSearching } = useCommuneSearch()

  function handleSelect(commune: CommuneSearchResult) {
    onSelect(commune)
    inputValue.value = ''
    showDropdown.value = false
    query.value = ''
  }

  const { highlightedIndex, handleKeydown, reset, handleBlur } = useDropdownKeyboard(
    results, showDropdown, handleSelect,
  )

  function handleInput() {
    const trimmed = inputValue.value.trim()
    if (isValidCommuneQuery(trimmed)) {
      query.value = trimmed
      showDropdown.value = true
      reset()
    }
    else {
      showDropdown.value = false
      query.value = ''
    }
  }

  return {
    inputValue,
    showDropdown,
    results,
    isSearching,
    highlightedIndex,
    handleSelect,
    handleInput,
    handleKeydown,
    handleBlur,
  }
}
