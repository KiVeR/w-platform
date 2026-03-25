import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref, watch } from 'vue'
import { mockUseI18n } from '../helpers/stubs'
import { stubAuthGlobals } from '../helpers/auth-stubs'

const mockGet = vi.fn()
const mockEnterPartner = vi.fn()

stubAuthGlobals({ $api: { GET: mockGet, POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
mockUseI18n()

const mockMagicKeys = {
  'Meta+k': ref(false),
  'Ctrl+k': ref(false),
}
vi.mock('@vueuse/core', () => ({
  useMagicKeys: () => mockMagicKeys,
  useDebounceFn: (fn: (...args: unknown[]) => unknown) => fn,
}))

vi.stubGlobal('useScopedNavigation', () => ({
  enterPartner: mockEnterPartner,
  scopedRoute: (p: string) => p,
  hubRoute: (p: string) => p,
  exitToHub: vi.fn(),
}))

vi.stubGlobal('onMounted', vi.fn())
vi.stubGlobal('onUnmounted', vi.fn())

const { useCommandPalette } = await import('@/composables/useCommandPalette')

describe('useCommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMagicKeys['Meta+k'].value = false
    mockMagicKeys['Ctrl+k'].value = false
  })

  it('isOpen starts as false', () => {
    const { isOpen } = useCommandPalette()
    expect(isOpen.value).toBe(false)
  })

  it('searchQuery starts empty', () => {
    const { searchQuery } = useCommandPalette()
    expect(searchQuery.value).toBe('')
  })

  it('partners starts empty', () => {
    const { partners } = useCommandPalette()
    expect(partners.value).toEqual([])
  })

  it('selectPartner calls enterPartner, closes palette and clears query', () => {
    const { selectPartner, isOpen, searchQuery } = useCommandPalette()
    isOpen.value = true
    searchQuery.value = 'test'

    selectPartner(42, 'Acme Corp')

    expect(mockEnterPartner).toHaveBeenCalledWith(42, 'Acme Corp')
    expect(isOpen.value).toBe(false)
    expect(searchQuery.value).toBe('')
  })

  it('close resets isOpen, searchQuery and partners', () => {
    const { close, isOpen, searchQuery, partners } = useCommandPalette()
    isOpen.value = true
    searchQuery.value = 'test'
    partners.value = [{ id: 1, name: 'Test' }]

    close()

    expect(isOpen.value).toBe(false)
    expect(searchQuery.value).toBe('')
    expect(partners.value).toEqual([])
  })

  it('search with < 2 chars clears partners', async () => {
    const { searchQuery, partners } = useCommandPalette()
    partners.value = [{ id: 1, name: 'Old' }]

    searchQuery.value = 'a'
    // Trigger the watcher manually (since debounce is mocked to run immediately)
    await new Promise(r => setTimeout(r, 10))

    expect(partners.value).toEqual([])
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('search with >= 2 chars calls API and maps results', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { id: 1, name: 'Acme Corp', extra: 'ignored' },
          { id: 2, name: 'Beta Inc', extra: 'ignored' },
        ],
      },
    })

    const { searchQuery, partners } = useCommandPalette()
    searchQuery.value = 'ac'

    await new Promise(r => setTimeout(r, 10))

    expect(mockGet).toHaveBeenCalledWith('/partners', {
      params: {
        query: {
          'filter[name]': 'ac',
          per_page: 8,
          'fields[partners]': 'id,name',
        },
      },
    })
    expect(partners.value).toEqual([
      { id: 1, name: 'Acme Corp' },
      { id: 2, name: 'Beta Inc' },
    ])
  })

  it('search handles API returning empty data', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } })

    const { searchQuery, partners } = useCommandPalette()
    searchQuery.value = 'xyz'
    await new Promise(r => setTimeout(r, 10))

    expect(partners.value).toEqual([])
  })

  it('search handles API returning null data', async () => {
    mockGet.mockResolvedValue({ data: null })

    const { searchQuery, partners } = useCommandPalette()
    searchQuery.value = 'test'
    await new Promise(r => setTimeout(r, 10))

    expect(partners.value).toEqual([])
  })
})
