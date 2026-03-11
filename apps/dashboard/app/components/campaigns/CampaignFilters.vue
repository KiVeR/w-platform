<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import CampaignDateRangeFilter from '@/components/campaigns/CampaignDateRangeFilter.vue'
import CampaignMultiStatusFilter from '@/components/campaigns/CampaignMultiStatusFilter.vue'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CampaignFilters, CampaignStatus } from '@/types/campaign'

const props = defineProps<{
  filters: CampaignFilters
}>()

const emit = defineEmits<{
  'update:filters': [filters: Partial<CampaignFilters>]
}>()

const { t } = useI18n()

const searchQuery = ref(props.filters.search)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.filters.search, (value) => {
  if (value !== searchQuery.value) {
    searchQuery.value = value
  }
})

watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('update:filters', { search: val })
  }, 300)
})

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})

function onStatusesChange(value: CampaignStatus[]) {
  emit('update:filters', { statuses: value })
}

function onTypeChange(val: string) {
  emit('update:filters', { type: val === 'all' ? '' : val })
}

function onDateRangeChange(value: { from: string, to: string }) {
  emit('update:filters', {
    dateFrom: value.from,
    dateTo: value.to,
  })
}
</script>

<template>
  <div class="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_180px_minmax(0,1fr)]">
    <div class="relative flex-1 min-w-[200px]">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        v-model="searchQuery"
        :placeholder="t('campaigns.filters.search')"
        class="pl-9"
      />
    </div>

    <CampaignMultiStatusFilter
      :model-value="filters.statuses"
      @update:model-value="onStatusesChange"
    />

    <div class="rounded-xl border bg-background p-3 shadow-xs">
      <p class="text-sm font-medium">
        {{ t('campaigns.filters.typeLabel') }}
      </p>

      <Select :model-value="filters.type || 'all'" @update:model-value="onTypeChange">
        <SelectTrigger class="mt-3 w-full">
          <SelectValue :placeholder="t('campaigns.filters.allTypes')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t('campaigns.filters.allTypes') }}</SelectItem>
          <SelectItem value="prospection">{{ t('campaigns.type.prospection') }}</SelectItem>
          <SelectItem value="fidelisation">{{ t('campaigns.type.fidelisation') }}</SelectItem>
          <SelectItem value="comptage">{{ t('campaigns.type.comptage') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <CampaignDateRangeFilter
      :model-value="{ from: filters.dateFrom, to: filters.dateTo }"
      @update:model-value="onDateRangeChange"
    />
  </div>
</template>
