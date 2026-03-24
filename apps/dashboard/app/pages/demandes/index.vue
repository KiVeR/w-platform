<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view demandes'],
  layout: 'default',
})

const { t } = useI18n()
const router = useRouter()
const {
  demandes, pagination, isLoading, hasError, filters, sort,
  fetchDemandes, setPage, setSort, setFilters,
} = useDemandes()

// Quick filters
const searchRef = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyFilters() {
  setFilters({
    ref_demande: searchRef.value || undefined,
    created_at_from: dateFrom.value || undefined,
    created_at_to: dateTo.value || undefined,
  })
  fetchDemandes()
}

function onSelect(demande: { id: number }) {
  router.push(`/demandes/${demande.id}`)
}

const { can } = usePermission()
const canManage = computed(() => can('manage demandes'))

onMounted(() => fetchDemandes())
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t('demandes.list.title') }}
      </h1>
      <NuxtLink v-if="canManage" to="/demandes/new">
        <Button>{{ t('demandes.list.new_button') }}</Button>
      </NuxtLink>
    </div>

    <!-- Quick filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <input
        v-model="searchRef"
        type="text"
        class="rounded-md border px-3 py-1.5 text-sm"
        :placeholder="t('demandes.list.search_placeholder')"
        data-testid="search-ref"
        @keyup.enter="applyFilters"
      >
      <input
        v-model="dateFrom"
        type="date"
        class="rounded-md border px-3 py-1.5 text-sm"
        data-testid="date-from"
      >
      <input
        v-model="dateTo"
        type="date"
        class="rounded-md border px-3 py-1.5 text-sm"
        data-testid="date-to"
      >
      <Button data-testid="filter-button" @click="applyFilters">
        {{ t('demandes.list.filter_button') }}
      </Button>
    </div>

    <!-- Error state -->
    <div
      v-if="hasError"
      class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-4"
      data-testid="error-state"
    >
      <span>{{ t('demandes.list.error') }}</span>
      <Button @click="fetchDemandes">{{ t('common.retry') }}</Button>
    </div>

    <!-- DataTable -->
    <DemandesDataTable
      :demandes="demandes"
      :is-loading="isLoading"
      :sort="sort"
      @select="onSelect"
      @sort="setSort"
    />

    <!-- Pagination -->
    <div v-if="pagination.lastPage > 1" class="flex items-center justify-end gap-2">
      <button
        :disabled="pagination.page <= 1"
        class="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
        data-testid="prev-page"
        @click="setPage(pagination.page - 1)"
      >
        {{ t('demandes.list.pagination.prev') }}
      </button>
      <button
        :disabled="pagination.page >= pagination.lastPage"
        class="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
        data-testid="next-page"
        @click="setPage(pagination.page + 1)"
      >
        {{ t('demandes.list.pagination.next') }}
      </button>
    </div>
  </div>
</template>
