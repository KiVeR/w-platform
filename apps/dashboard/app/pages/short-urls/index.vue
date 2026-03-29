<script setup lang="ts">
import { Download, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import ShortUrlFilters from '@/components/short-urls/ShortUrlFilters.vue'
import ShortUrlDataTable from '@/components/short-urls/ShortUrlDataTable.vue'
import { useShortUrls } from '@/composables/useShortUrls'
import { usePermission } from '@/composables/usePermission'
import type { ShortUrlFilters as ShortUrlFiltersState } from '@/types/shortUrl'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view short-urls'],
})

const { t } = useI18n()
const { can } = usePermission()

const {
  shortUrls, pagination, isLoading, hasError, filters, sort, isExporting,
  fetchShortUrls, deleteShortUrl, setPage, setSort, setFilters, exportCsv,
} = useShortUrls()

onMounted(() => fetchShortUrls())

async function handleDelete(id: number) {
  const success = await deleteShortUrl(id)
  if (success) { toast.success(t('shortUrls.form.saveSuccess')); await fetchShortUrls() }
}

function handleView(id: number) { navigateTo(`/short-urls/${id}`) }
function handleEdit(id: number) { navigateTo(`/short-urls/${id}/edit`) }

async function handleFilterUpdate(f: Partial<ShortUrlFiltersState>) {
  setFilters(f); await fetchShortUrls()
}

async function handleSort(field: string) { await setSort(field) }
async function handlePage(page: number) { await setPage(page) }
async function handleExport() { await exportCsv() }
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ t('shortUrls.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ t('shortUrls.description') }}</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="isExporting" @click="handleExport">
          <Download class="mr-2 size-4" />{{ t('shortUrls.actions.export') }}
        </Button>
        <NuxtLink v-if="can('manage short-urls')" to="/short-urls/new">
          <Button><Plus class="mr-2 size-4" />{{ t('shortUrls.actions.create') }}</Button>
        </NuxtLink>
      </div>
    </div>
    <ShortUrlFilters :filters="filters" @update:filters="handleFilterUpdate" />
    <ShortUrlDataTable :data="shortUrls" :is-loading="isLoading" :has-error="hasError" :sort="sort" :pagination="pagination" @sort="handleSort" @page="handlePage" @delete="handleDelete" @view="handleView" @edit="handleEdit" @retry="fetchShortUrls" />
  </div>
</template>
