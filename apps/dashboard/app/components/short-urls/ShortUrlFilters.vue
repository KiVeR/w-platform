<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { Search } from 'lucide-vue-next'
import type { AcceptableValue } from 'reka-ui'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ShortUrlFilters } from '@/types/shortUrl'

const props = defineProps<{ filters: ShortUrlFilters }>()
const emit = defineEmits<{ 'update:filters': [filters: Partial<ShortUrlFilters>] }>()
const { t } = useI18n()

const searchQuery = ref(props.filters.search)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.filters.search, (value) => {
  if (value !== searchQuery.value) searchQuery.value = value
})

watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { emit('update:filters', { search: val }) }, 300)
})

onBeforeUnmount(() => { if (searchTimeout) clearTimeout(searchTimeout) })

function onStatusChange(value: AcceptableValue) {
  emit('update:filters', { isEnabled: value as ShortUrlFilters['isEnabled'] })
}
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3">
    <div class="relative flex-1 min-w-[200px]">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input v-model="searchQuery" :placeholder="t('shortUrls.filters.search')" class="pl-9" />
    </div>
    <div class="w-full sm:w-[180px]">
      <Select :model-value="filters.isEnabled" @update:model-value="onStatusChange">
        <SelectTrigger><SelectValue :placeholder="t('shortUrls.filters.status')" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t('shortUrls.filters.statusAll') }}</SelectItem>
          <SelectItem value="true">{{ t('shortUrls.filters.statusEnabled') }}</SelectItem>
          <SelectItem value="false">{{ t('shortUrls.filters.statusDisabled') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
