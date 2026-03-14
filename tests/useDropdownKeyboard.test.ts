import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

vi.stubGlobal('onScopeDispose', vi.fn())

const { useDropdownKeyboard } = await import('#targeting/composables/useDropdownKeyboard')

describe('useDropdownKeyboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createKeyboardEvent(key: string): KeyboardEvent {
    return new KeyboardEvent('keydown', { key, cancelable: true })
  }

  it('initializes with highlightedIndex = -1', () => {
    const items = ref(['a', 'b', 'c'])
    const isOpen = ref(true)
    const { highlightedIndex } = useDropdownKeyboard(items, isOpen, vi.fn())
    expect(highlightedIndex.value).toBe(-1)
  })

  it('ArrowDown increments index', () => {
    const items = ref(['a', 'b', 'c'])
    const isOpen = ref(true)
    const { highlightedIndex, handleKeydown } = useDropdownKeyboard(items, isOpen, vi.fn())

    handleKeydown(createKeyboardEvent('ArrowDown'))
    expect(highlightedIndex.value).toBe(0)

    handleKeydown(createKeyboardEvent('ArrowDown'))
    expect(highlightedIndex.value).toBe(1)
  })

  it('ArrowDown clamps at last item', () => {
    const items = ref(['a', 'b'])
    const isOpen = ref(true)
    const { highlightedIndex, handleKeydown } = useDropdownKeyboard(items, isOpen, vi.fn())

    handleKeydown(createKeyboardEvent('ArrowDown'))
    handleKeydown(createKeyboardEvent('ArrowDown'))
    handleKeydown(createKeyboardEvent('ArrowDown'))
    expect(highlightedIndex.value).toBe(1)
  })

  it('ArrowUp decrements index', () => {
    const items = ref(['a', 'b', 'c'])
    const isOpen = ref(true)
    const { highlightedIndex, handleKeydown } = useDropdownKeyboard(items, isOpen, vi.fn())

    handleKeydown(createKeyboardEvent('ArrowDown'))
    handleKeydown(createKeyboardEvent('ArrowDown'))
    handleKeydown(createKeyboardEvent('ArrowUp'))
    expect(highlightedIndex.value).toBe(0)
  })

  it('ArrowUp clamps at 0', () => {
    const items = ref(['a', 'b'])
    const isOpen = ref(true)
    const { highlightedIndex, handleKeydown } = useDropdownKeyboard(items, isOpen, vi.fn())

    handleKeydown(createKeyboardEvent('ArrowUp'))
    expect(highlightedIndex.value).toBe(0)
  })

  it('Enter calls onSelect with highlighted item', () => {
    const items = ref(['a', 'b', 'c'])
    const isOpen = ref(true)
    const onSelect = vi.fn()
    const { handleKeydown } = useDropdownKeyboard(items, isOpen, onSelect)

    handleKeydown(createKeyboardEvent('ArrowDown'))
    handleKeydown(createKeyboardEvent('Enter'))
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('Enter does nothing when highlightedIndex is -1', () => {
    const items = ref(['a', 'b'])
    const isOpen = ref(true)
    const onSelect = vi.fn()
    const { handleKeydown } = useDropdownKeyboard(items, isOpen, onSelect)

    handleKeydown(createKeyboardEvent('Enter'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('Escape closes dropdown', () => {
    const items = ref(['a'])
    const isOpen = ref(true)
    const { handleKeydown } = useDropdownKeyboard(items, isOpen, vi.fn())

    handleKeydown(createKeyboardEvent('Escape'))
    expect(isOpen.value).toBe(false)
  })

  it('returns false when dropdown is closed', () => {
    const items = ref(['a'])
    const isOpen = ref(false)
    const { handleKeydown } = useDropdownKeyboard(items, isOpen, vi.fn())

    const handled = handleKeydown(createKeyboardEvent('ArrowDown'))
    expect(handled).toBe(false)
  })

  it('returns false when items are empty', () => {
    const items = ref<string[]>([])
    const isOpen = ref(true)
    const { handleKeydown } = useDropdownKeyboard(items, isOpen, vi.fn())

    const handled = handleKeydown(createKeyboardEvent('ArrowDown'))
    expect(handled).toBe(false)
  })

  it('handleBlur closes dropdown after 200ms', () => {
    const items = ref(['a'])
    const isOpen = ref(true)
    const { handleBlur } = useDropdownKeyboard(items, isOpen, vi.fn())

    handleBlur()
    expect(isOpen.value).toBe(true)

    vi.advanceTimersByTime(200)
    expect(isOpen.value).toBe(false)
  })

  it('reset sets highlightedIndex to -1', () => {
    const items = ref(['a', 'b'])
    const isOpen = ref(true)
    const { highlightedIndex, handleKeydown, reset } = useDropdownKeyboard(items, isOpen, vi.fn())

    handleKeydown(createKeyboardEvent('ArrowDown'))
    expect(highlightedIndex.value).toBe(0)

    reset()
    expect(highlightedIndex.value).toBe(-1)
  })
})
