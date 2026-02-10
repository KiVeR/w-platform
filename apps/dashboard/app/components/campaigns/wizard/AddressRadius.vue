<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAddressSearch } from '@/composables/useAddressSearch'
import type { AddressResult } from '@/composables/useAddressSearch'

defineProps<{
  address: string | null
  lat: number | null
  lng: number | null
  radius: number | null
}>()

const emit = defineEmits<{
  'update:address': [value: string | null]
  'update:lat': [value: number | null]
  'update:lng': [value: number | null]
  'update:radius': [value: number]
}>()

const { t } = useI18n()
const { query, results, isSearching, clear: clearSearch } = useAddressSearch()

function selectResult(result: AddressResult) {
  emit('update:address', result.label)
  emit('update:lat', result.lat)
  emit('update:lng', result.lng)
  query.value = result.label
  results.value = []
}

function clearAddress() {
  emit('update:address', null)
  emit('update:lat', null)
  emit('update:lng', null)
  clearSearch()
}

function onRadiusInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (value >= 1 && value <= 50) {
    emit('update:radius', value)
  }
}
</script>

<template>
  <div data-address-radius class="space-y-4">
    <div class="relative">
      <div class="flex gap-2">
        <Input
          v-model="query"
          data-address-input
          :placeholder="t('wizard.targeting.address.placeholder')"
          class="flex-1"
        />
        <Button
          v-if="address"
          data-clear-address
          variant="ghost"
          size="icon"
          @click="clearAddress"
        >
          <X class="size-4" />
        </Button>
      </div>

      <div
        v-if="results.length > 0"
        class="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
      >
        <div
          v-for="(result, i) in results"
          :key="i"
          data-address-result
          class="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
          @click="selectResult(result)"
        >
          {{ result.label }}
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <Label>{{ t('wizard.targeting.address.radius') }}</Label>
      <div class="flex items-center gap-3">
        <Input
          data-radius-input
          type="number"
          :value="radius ?? 10"
          min="1"
          max="50"
          class="w-24"
          @input="onRadiusInput"
        />
        <span class="text-sm text-muted-foreground">{{ t('wizard.targeting.address.radiusUnit') }}</span>
      </div>
    </div>
  </div>
</template>
