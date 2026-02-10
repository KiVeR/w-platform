<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CampaignFilters } from '@/types/campaign'

const props = defineProps<{
  filters: CampaignFilters
}>()

const emit = defineEmits<{
  'update:filters': [filters: Partial<CampaignFilters>]
}>()

const { t } = useI18n()

const searchQuery = ref(props.filters.search)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('update:filters', { search: val })
  }, 300)
})

function onStatusChange(val: string) {
  emit('update:filters', { status: val === 'all' ? '' : val })
}

function onTypeChange(val: string) {
  emit('update:filters', { type: val === 'all' ? '' : val })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-[200px]">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        v-model="searchQuery"
        :placeholder="t('campaigns.filters.search')"
        class="pl-9"
      />
    </div>

    <Select :model-value="filters.status || 'all'" @update:model-value="onStatusChange">
      <SelectTrigger class="w-[180px]">
        <SelectValue :placeholder="t('campaigns.filters.allStatuses')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{{ t('campaigns.filters.allStatuses') }}</SelectItem>
        <SelectItem value="draft">{{ t('campaigns.status.draft') }}</SelectItem>
        <SelectItem value="scheduled">{{ t('campaigns.status.scheduled') }}</SelectItem>
        <SelectItem value="sending">{{ t('campaigns.status.sending') }}</SelectItem>
        <SelectItem value="sent">{{ t('campaigns.status.sent') }}</SelectItem>
        <SelectItem value="cancelled">{{ t('campaigns.status.cancelled') }}</SelectItem>
        <SelectItem value="failed">{{ t('campaigns.status.failed') }}</SelectItem>
      </SelectContent>
    </Select>

    <Select :model-value="filters.type || 'all'" @update:model-value="onTypeChange">
      <SelectTrigger class="w-[180px]">
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
</template>
