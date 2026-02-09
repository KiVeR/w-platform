<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { Globe, Loader2, Search, User } from 'lucide-vue-next'

const props = defineProps<{
  selectedUuid?: string
}>()

const emit = defineEmits<{
  select: [schema: VariableSchemaListItem]
  close: []
}>()

const searchQuery = ref('')
const currentPage = ref(1)
const isLoading = ref(false)
const error = ref<string | null>(null)
const data = ref<VariableSchemaListItem[]>([])
const meta = ref<VariableSchemaListResponse['meta'] | null>(null)
const localSelected = ref<string | undefined>(props.selectedUuid)

// Lazy API init — useEditorApi() uses inject() which cannot read a provide()
// from the same component tree level at construction time
let _api: ReturnType<typeof useEditorApi> | null = null
function getApi() {
  if (!_api)
    _api = useEditorApi()
  return _api
}

async function fetchSchemas() {
  isLoading.value = true
  error.value = null
  try {
    const params: Record<string, string> = {
      'page[number]': String(currentPage.value),
      'page[size]': '15',
      'sort': '-created_at',
    }
    if (searchQuery.value.trim())
      params['filter[name]'] = searchQuery.value.trim()

    const result = await getApi().get<VariableSchemaListResponse>('/variable-schemas', { params })
    data.value = result.data
    meta.value = result.meta
  }
  catch (err: any) {
    error.value = err?.message ?? 'Erreur lors du chargement des schémas'
  }
  finally {
    isLoading.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  fetchSchemas()
}, 300)

function handleSearch(event: Event) {
  searchQuery.value = (event.target as HTMLInputElement).value
  debouncedSearch()
}

function selectSchema(schema: VariableSchemaListItem) {
  localSelected.value = schema.id
  emit('select', schema)
}

function goToPage(page: number) {
  currentPage.value = page
  fetchSchemas()
}

onMounted(() => {
  fetchSchemas()
})
</script>

<template>
  <div class="schema-browser">
    <div class="search-bar">
      <Search :size="14" class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder="Rechercher un schéma..."
        :value="searchQuery"
        @input="handleSearch"
      >
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="browser-state">
      <Loader2 :size="20" class="spinner" />
      <span>Chargement...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="browser-state browser-error">
      <span>{{ error }}</span>
      <button class="retry-link" @click="fetchSchemas">
        Réessayer
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="data.length === 0" class="browser-state">
      <span class="empty-text">Aucun schéma trouvé</span>
    </div>

    <!-- List -->
    <div v-else class="schema-list">
      <button
        v-for="schema in data"
        :key="schema.id"
        class="schema-item"
        :class="{ selected: localSelected === schema.id }"
        @click="selectSchema(schema)"
      >
        <span class="schema-name">{{ schema.name }}</span>
        <div class="schema-badges">
          <span v-if="schema.global_variables.length > 0" class="badge badge-global">
            <Globe :size="10" />
            {{ schema.global_variables.length }}
          </span>
          <span v-if="schema.recipient_variables.length > 0" class="badge badge-recipient">
            <User :size="10" />
            {{ schema.recipient_variables.length }}
          </span>
        </div>
      </button>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.last_page > 1" class="pagination">
      <button
        class="page-btn"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        Précédent
      </button>
      <span class="page-info">{{ currentPage }} / {{ meta.last_page }}</span>
      <button
        class="page-btn"
        :disabled="currentPage >= meta.last_page"
        @click="goToPage(currentPage + 1)"
      >
        Suivant
      </button>
    </div>
  </div>
</template>

<style scoped>
.schema-browser {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-bar {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-neutral-400);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 34px;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: var(--color-neutral-800);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-info-500);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-info-500) 10%, transparent);
}

.search-input::placeholder {
  color: var(--color-neutral-400);
}

.browser-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.browser-error {
  color: var(--color-error-600);
}

.retry-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: var(--text-sm);
  text-decoration: underline;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-text {
  color: var(--color-text-muted);
}

.schema-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.schema-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.schema-item:hover {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-300);
}

.schema-item.selected {
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  border-color: var(--color-primary);
}

.schema-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-800);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schema-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
}

.badge-global {
  background: #dcfce7;
  color: #166534;
}

.badge-recipient {
  background: #dbeafe;
  color: #1e40af;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-300);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
