<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import CampaignFilters from '@/components/campaigns/CampaignFilters.vue'
import CampaignDataTable from '@/components/campaigns/CampaignDataTable.vue'
import { useCampaigns } from '@/composables/useCampaigns'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const wizard = useCampaignWizardStore()
const api = useApi()

const {
  campaigns,
  pagination,
  isLoading,
  hasError,
  filters,
  sort,
  fetchCampaigns,
  deleteCampaign,
  setPage,
  setSort,
  setFilters,
} = useCampaigns()

onMounted(() => fetchCampaigns())

async function handleDelete(id: number) {
  const success = await deleteCampaign(id)
  if (success) {
    toast.success(t('campaigns.deleteSuccess'))
    await fetchCampaigns()
  }
}

function handleView(id: number) {
  navigateTo(`/campaigns/${id}`)
}

async function handleFilterUpdate(f: Record<string, string>) {
  setFilters(f)
  await fetchCampaigns()
}

async function handleSort(field: string) {
  await setSort(field)
}

async function handlePage(page: number) {
  await setPage(page)
}

async function handleDuplicate(id: number) {
  const { data, error } = await api.GET('/campaigns/{campaign}', {
    params: { path: { campaign: id } },
  } as never)
  if (error || !data) return
  const raw = (data as { data: Record<string, unknown> }).data
  wizard.initFromCampaign(raw)
  navigateTo('/campaigns/new')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ t('campaigns.title') }}
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('campaigns.description') }}
        </p>
      </div>
      <NuxtLink to="/campaigns/new">
        <Button>
          <Plus class="mr-2 size-4" />
          {{ t('campaigns.new') }}
        </Button>
      </NuxtLink>
    </div>

    <!-- Filters -->
    <CampaignFilters
      :filters="filters"
      @update:filters="handleFilterUpdate"
    />

    <!-- DataTable -->
    <CampaignDataTable
      :data="campaigns"
      :is-loading="isLoading"
      :has-error="hasError"
      :sort="sort"
      :pagination="pagination"
      @sort="handleSort"
      @page="handlePage"
      @delete="handleDelete"
      @view="handleView"
      @duplicate="handleDuplicate"
      @retry="fetchCampaigns"
    />
  </div>
</template>
