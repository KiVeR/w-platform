import type { VariableField } from '../types/variable'
import { useVariableSchemaStore } from '../stores/variableSchema'

export function useVariableAutocomplete() {
  const store = useVariableSchemaStore()

  const isActive = ref(false)
  const selectedIndex = ref(0)
  const query = ref('')

  const suggestions = computed<VariableField[]>(() => {
    if (!isActive.value)
      return []
    const q = query.value.toLowerCase()
    const all = store.allVariables as VariableField[]
    if (!q)
      return all
    return all.filter(v => v.name.toLowerCase().includes(q))
  })

  function handleInput(text: string, cursorPos: number): void {
    if (!text || cursorPos <= 0) {
      isActive.value = false
      return
    }

    // Find the last '${' before cursor that isn't closed
    const before = text.slice(0, cursorPos)
    const lastOpen = before.lastIndexOf('${')

    if (lastOpen === -1) {
      isActive.value = false
      return
    }

    // Check if there's a closing '}' between '${' and cursor
    const afterOpen = before.slice(lastOpen + 2)
    if (afterOpen.includes('}')) {
      isActive.value = false
      return
    }

    // We're inside an open ${...
    query.value = afterOpen
    isActive.value = true
    selectedIndex.value = 0
  }

  function moveDown(): void {
    if (suggestions.value.length === 0)
      return
    selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
  }

  function moveUp(): void {
    if (suggestions.value.length === 0)
      return
    selectedIndex.value = selectedIndex.value <= 0
      ? suggestions.value.length - 1
      : selectedIndex.value - 1
  }

  function selectCurrent(): string | null {
    if (suggestions.value.length === 0)
      return null
    const selected = suggestions.value[selectedIndex.value]
    isActive.value = false
    selectedIndex.value = 0
    return selected?.name ?? null
  }

  function dismiss(): void {
    isActive.value = false
    selectedIndex.value = 0
  }

  return {
    isActive,
    selectedIndex,
    suggestions,
    handleInput,
    moveDown,
    moveUp,
    selectCurrent,
    dismiss,
  }
}
