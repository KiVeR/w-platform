<script setup lang="ts">
import { Globe, Search, User } from 'lucide-vue-next'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  select: [varName: string]
  close: []
}>()

const store = useVariableSchemaStore()
const searchQuery = ref('')

const filteredGlobal = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q)
    return store.globalVariables
  return store.globalVariables.filter((v: any) => v.name.toLowerCase().includes(q))
})

const filteredRecipient = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q)
    return store.recipientVariables
  return store.recipientVariables.filter((v: any) => v.name.toLowerCase().includes(q))
})

const allFiltered = computed(() => [
  ...filteredGlobal.value,
  ...filteredRecipient.value,
])

const hasResults = computed(() => allFiltered.value.length > 0)

const focusedIndex = ref(-1)

watch(searchQuery, () => {
  focusedIndex.value = -1
})

function selectVariable(name: string) {
  emit('select', name)
  searchQuery.value = ''
  focusedIndex.value = -1
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
  else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (allFiltered.value.length > 0) {
      focusedIndex.value = (focusedIndex.value + 1) % allFiltered.value.length
    }
  }
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (allFiltered.value.length > 0) {
      focusedIndex.value = focusedIndex.value <= 0
        ? allFiltered.value.length - 1
        : focusedIndex.value - 1
    }
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    const item = allFiltered.value[focusedIndex.value]
    if (item) {
      selectVariable(item.name)
    }
  }
}

function getItemIndex(name: string): number {
  return allFiltered.value.findIndex(v => v.name === name)
}
</script>

<template>
  <div
    v-if="open"
    class="variable-picker"
    role="listbox"
    aria-label="Variables disponibles"
    @keydown="handleKeydown"
  >
    <div class="variable-picker-search">
      <Search :size="14" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Rechercher..."
        aria-label="Rechercher une variable"
      >
    </div>

    <div v-if="!store.isAvailable" class="variable-picker-empty">
      Aucun schéma de variables chargé
    </div>

    <template v-else-if="hasResults">
      <div v-if="filteredGlobal.length > 0" class="variable-picker-section">
        <div class="section-label">
          <Globe :size="12" />
          Globales
        </div>
        <button
          v-for="v in filteredGlobal"
          :key="v.name"
          class="variable-picker-item"
          :class="{ 'is-focused': getItemIndex(v.name) === focusedIndex }"
          role="option"
          :aria-selected="getItemIndex(v.name) === focusedIndex"
          @click="selectVariable(v.name)"
        >
          <span class="item-name">{{ v.name }}</span>
          <span v-if="v.description" class="item-desc">{{ v.description }}</span>
        </button>
      </div>

      <div v-if="filteredRecipient.length > 0" class="variable-picker-section">
        <div class="section-label">
          <User :size="12" />
          Destinataire
        </div>
        <button
          v-for="v in filteredRecipient"
          :key="v.name"
          class="variable-picker-item"
          :class="{ 'is-focused': getItemIndex(v.name) === focusedIndex }"
          role="option"
          :aria-selected="getItemIndex(v.name) === focusedIndex"
          @click="selectVariable(v.name)"
        >
          <span class="item-name">{{ v.name }}</span>
          <span v-if="v.description" class="item-desc">{{ v.description }}</span>
        </button>
      </div>
    </template>

    <div v-else class="variable-picker-empty">
      Aucune variable trouvée
    </div>
  </div>
</template>

<style scoped>
.variable-picker {
  min-width: 220px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 8px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
  font-size: 13px;
}

.variable-picker-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.search-icon {
  color: var(--color-text-muted, #94a3b8);
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  width: 100%;
}

.variable-picker-section {
  padding: 4px 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted, #94a3b8);
}

.variable-picker-item {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 6px 10px 6px 26px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.variable-picker-item:hover,
.variable-picker-item.is-focused {
  background-color: var(--color-surface-hover, #f1f5f9);
}

.item-name {
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.item-desc {
  font-size: 11px;
  color: var(--color-text-muted, #94a3b8);
  margin-top: 1px;
}

.variable-picker-empty {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted, #94a3b8);
  font-size: 13px;
}
</style>
