<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import PartnerDataTable from '@/components/hub/PartnerDataTable.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { AcceptableValue } from 'reka-ui'
import type { PartnerRow } from '@/types/partner'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view partners'],
})

const { t } = useI18n()
const auth = useAuthStore()
const { enterPartner } = useScopedNavigation()

const {
  partners,
  pagination,
  isLoading,
  hasError,
  filters,
  sort,
  fetchPartners,
  setPage,
  setSort,
  setFilters,
} = usePartners()

const searchQuery = ref('')
const statusFilter = ref<string>('all')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput(val: string | number) {
  const value = String(val)
  searchQuery.value = value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    setFilters({ name: value || undefined })
    fetchPartners()
  }, 300)
}

function onStatusChange(val: AcceptableValue) {
  const value = String(val)
  statusFilter.value = value
  if (value === 'all') {
    setFilters({ is_active: null })
  }
  else {
    setFilters({ is_active: value === 'active' })
  }
  fetchPartners()
}

function handleEnter(partner: PartnerRow) {
  enterPartner(partner.id, partner.name)
}

function handleEdit(id: number) {
  navigateTo(`/hub/partners/${id}`)
}

function handleSort(field: string) {
  setSort(field)
}

function handlePage(page: number) {
  setPage(page)
}

function handleRetry() {
  fetchPartners()
}

onMounted(() => {
  fetchPartners()
})
</script>

<template>
  <div
    data-hub-partners-page
    class="space-y-6"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ t('hub.partners.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('hub.partners.description') }}
        </p>
      </div>
      <NuxtLink
        v-if="auth.isAdmin"
        to="/hub/partners/new"
      >
        <Button data-new-partner-btn>
          {{ t('hub.partners.newPartner') }}
        </Button>
      </NuxtLink>
    </div>

    <!-- Filters bar -->
    <div class="flex items-center gap-4">
      <Input
        data-search-input
        :model-value="searchQuery"
        :placeholder="t('hub.partners.searchPlaceholder')"
        class="max-w-sm"
        @update:model-value="onSearchInput"
      />
      <Select
        :model-value="statusFilter"
        @update:model-value="onStatusChange"
      >
        <SelectTrigger
          data-status-filter
          class="w-[180px]"
        >
          <SelectValue :placeholder="t('hub.partners.statusFilter.all')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {{ t('hub.partners.statusFilter.all') }}
          </SelectItem>
          <SelectItem value="active">
            {{ t('hub.partners.statusFilter.active') }}
          </SelectItem>
          <SelectItem value="inactive">
            {{ t('hub.partners.statusFilter.inactive') }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- DataTable -->
    <PartnerDataTable
      :data="partners"
      :is-loading="isLoading"
      :has-error="hasError"
      :sort="sort"
      :pagination="pagination"
      @sort="handleSort"
      @page="handlePage"
      @enter="handleEnter"
      @edit="handleEdit"
      @retry="handleRetry"
    />
  </div>
</template>
