import { ref, watch } from 'vue'
import { useMagicKeys } from '@vueuse/core'

export function useCommandPalette() {
  const isOpen = ref(false)
  const searchQuery = ref('')
  const partners = ref<{ id: number; name: string }[]>([])
  const { enterPartner } = useScopedNavigation()
  const api = useNuxtApp().$api

  // Keyboard shortcut Cmd+K / Ctrl+K
  const keys = useMagicKeys()
  const cmdK = keys['Meta+k']
  const ctrlK = keys['Ctrl+k']

  watch([cmdK, ctrlK], ([meta, ctrl]) => {
    if (meta || ctrl) {
      isOpen.value = !isOpen.value
    }
  })

  // Debounced partner search (300ms)
  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  async function doSearch(query: string) {
    if (!query || query.length < 2) {
      partners.value = []
      return
    }
    const { data } = await api.GET('/partners', {
      params: { query: { 'filter[name]': query, per_page: 8, 'fields[partners]': 'id,name' } },
    })
    partners.value = (data?.data ?? []).map((p: { id: number; name: string }) => ({
      id: p.id,
      name: p.name,
    }))
  }

  watch(searchQuery, (q) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => doSearch(q), 300)
  })

  function selectPartner(id: number, name: string) {
    isOpen.value = false
    searchQuery.value = ''
    enterPartner(id, name)
  }

  function close() {
    isOpen.value = false
    searchQuery.value = ''
    partners.value = []
  }

  return { isOpen, searchQuery, partners, selectPartner, close }
}
