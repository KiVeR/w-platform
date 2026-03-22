<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapPin, X, Loader2 } from 'lucide-vue-next'
import { Button } from '#targeting/components/ui/button'
import { Card, CardContent } from '#targeting/components/ui/card'
import { Input } from '#targeting/components/ui/input'
import { Label } from '#targeting/components/ui/label'
import { Slider } from '#targeting/components/ui/slider'
import { useAddressSearch } from '#targeting/composables/useAddressSearch'
import { useDropdownKeyboard } from '#targeting/composables/useDropdownKeyboard'
import { sliderToKm, kmToSlider } from '#targeting/composables/useLogarithmicRadius'
import type { AddressResult } from '#targeting/types/targeting'

const props = defineProps<{
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
const showDropdown = ref(true)

function selectResult(result: AddressResult) {
  emit('update:address', result.label)
  emit('update:lat', result.lat)
  emit('update:lng', result.lng)
  query.value = result.label
  showDropdown.value = false
}

const { highlightedIndex, handleKeydown, handleBlur } = useDropdownKeyboard(
  results, showDropdown, selectResult,
)

function handleInput() {
  showDropdown.value = query.value.length > 0
}

function clearAddress() {
  emit('update:address', null)
  emit('update:lat', null)
  emit('update:lng', null)
  showDropdown.value = false
  clearSearch()
}

const sliderPosition = computed(() => [kmToSlider(props.radius ?? 10)])

function onSliderChange(value?: number[]) {
  const nextValue = value?.[0]
  if (nextValue === undefined)
    return

  emit('update:radius', sliderToKm(nextValue))
}
</script>

<template>
  <div data-address-radius class="space-y-4">
    <div class="relative">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Input
            v-model="query"
            data-address-input
            role="combobox"
            :aria-expanded="showDropdown && results.length > 0"
            aria-controls="address-listbox"
            :placeholder="t('wizard.targeting.address.placeholder')"
            @input="handleInput"
            @keydown="handleKeydown"
            @blur="handleBlur"
          />
          <Loader2
            v-if="isSearching"
            class="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        </div>
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
        v-if="showDropdown && results.length > 0"
        id="address-listbox"
        role="listbox"
        class="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
      >
        <button
          v-for="(result, idx) in results"
          :key="`${result.lat}-${result.lng}`"
          type="button"
          role="option"
          :aria-selected="idx === highlightedIndex"
          data-address-result
          class="flex w-full cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-muted"
          :class="idx === highlightedIndex ? 'bg-accent' : ''"
          @mousedown.prevent="selectResult(result)"
        >
          {{ result.label }}
        </button>
      </div>
    </div>

    <Card v-if="address" data-address-recap class="bg-primary/5 border-primary/20">
      <CardContent class="flex items-center gap-3 p-3">
        <div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <MapPin class="size-4 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ address }}</p>
          <p class="text-xs text-muted-foreground">
            {{ t('wizard.targeting.address.radius') }} : {{ radius ?? 10 }} km
          </p>
        </div>
      </CardContent>
    </Card>

    <div class="space-y-3">
      <Label>{{ t('wizard.targeting.address.radius') }}</Label>
      <div class="flex items-center gap-4">
        <Slider
          data-radius-input
          :model-value="sliderPosition"
          :min="0"
          :max="100"
          :step="1"
          class="flex-1"
          @update:model-value="onSliderChange"
        />
        <span class="w-16 text-right text-sm font-medium tabular-nums">
          {{ radius ?? 10 }} {{ t('wizard.targeting.address.radiusUnit') }}
        </span>
      </div>
    </div>
  </div>
</template>
