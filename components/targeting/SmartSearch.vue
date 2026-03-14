<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapPin, Hash, Navigation, X, Loader2, Search } from 'lucide-vue-next'
import { Badge } from '#targeting/components/ui/badge'
import { Card, CardContent } from '#targeting/components/ui/card'
import { Input } from '#targeting/components/ui/input'
import { Label } from '#targeting/components/ui/label'
import { Slider } from '#targeting/components/ui/slider'
import { useSmartSearch } from '#targeting/composables/useSmartSearch'
import { useDropdownKeyboard } from '#targeting/composables/useDropdownKeyboard'
import { sliderToKm, kmToSlider } from '#targeting/composables/useLogarithmicRadius'
import type { SmartSearchResult } from '#targeting/types/targeting'

const props = defineProps<{
  departments: string[]
  postcodes: string[]
  address: string | null
  lat: number | null
  lng: number | null
  radius: number | null
}>()

const emit = defineEmits<{
  select: [result: SmartSearchResult]
  'remove-department': [code: string]
  'remove-postcode': [code: string]
  'clear-address': []
  'update:radius': [value: number]
}>()

const { t } = useI18n()
const { query, isSearching, groupedResults, hasResults, clear } = useSmartSearch()
const showDropdown = ref(true)

const flatResults = computed<SmartSearchResult[]>(() => [
  ...groupedResults.value.postcodes,
  ...groupedResults.value.departments,
  ...groupedResults.value.addresses,
])

function selectResult(result: SmartSearchResult) {
  emit('select', result)
  showDropdown.value = false
  clear()
}

const { highlightedIndex, handleKeydown, handleBlur } = useDropdownKeyboard(
  flatResults, showDropdown, selectResult,
)

function handleInput() {
  showDropdown.value = query.value.trim().length > 0
}

const postcodeOffset = computed(() => groupedResults.value.postcodes.length)
const departmentOffset = computed(() => postcodeOffset.value + groupedResults.value.departments.length)

const hasSelection = computed(() =>
  props.departments.length > 0
  || props.postcodes.length > 0
  || props.address !== null,
)

const showAddressControls = computed(() =>
  props.address !== null && props.lat !== null && props.lng !== null,
)

const sliderPosition = computed(() => [kmToSlider(props.radius ?? 10)])

function onSliderChange(value?: number[]) {
  const nextValue = value?.[0]
  if (nextValue === undefined)
    return

  emit('update:radius', sliderToKm(nextValue))
}
</script>

<template>
  <div data-smart-search class="space-y-4">
    <!-- Selected chips -->
    <TransitionGroup
      v-if="hasSelection"
      tag="div"
      name="badge"
      class="flex flex-wrap gap-1.5"
      data-smart-search-chips
    >
      <Badge
        v-for="code in departments"
        :key="`dept-${code}`"
        variant="secondary"
        class="gap-1 pr-1"
        data-dept-chip
      >
        <MapPin class="size-3" />
        {{ code }}
        <button
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          @click="emit('remove-department', code)"
        >
          <X class="size-3" />
        </button>
      </Badge>

      <Badge
        v-for="cp in postcodes"
        :key="`cp-${cp}`"
        variant="secondary"
        class="gap-1 pr-1"
        data-cp-chip
      >
        <Hash class="size-3" />
        {{ cp }}
        <button
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          @click="emit('remove-postcode', cp)"
        >
          <X class="size-3" />
        </button>
      </Badge>

      <Badge
        v-if="address"
        variant="secondary"
        class="gap-1 pr-1"
        data-address-chip
      >
        <Navigation class="size-3" />
        <span class="max-w-48 truncate">{{ address }}</span>
        <button
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          @click="emit('clear-address')"
        >
          <X class="size-3" />
        </button>
      </Badge>
    </TransitionGroup>

    <!-- Search input -->
    <div class="relative">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="query"
          data-smart-search-input
          role="combobox"
          :aria-expanded="showDropdown && hasResults"
          aria-controls="smart-search-listbox"
          class="pl-9"
          :placeholder="t('wizard.targeting.smartSearch.placeholder')"
          @input="handleInput"
          @keydown="handleKeydown"
          @blur="handleBlur"
        />
        <Loader2
          v-if="isSearching"
          class="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      </div>

      <!-- Grouped results dropdown -->
      <div
        v-if="showDropdown && hasResults"
        id="smart-search-listbox"
        role="listbox"
        class="absolute mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md"
        style="z-index: 1100"
        data-smart-search-dropdown
      >
        <!-- Postcodes/communes group -->
        <div v-if="groupedResults.postcodes.length > 0">
          <p class="px-3 py-1.5 text-xs font-medium text-muted-foreground" data-group-postcodes>
            {{ t('wizard.targeting.smartSearch.groupPostcodes') }}
          </p>
          <button
            v-for="(result, idx) in groupedResults.postcodes"
            :key="`cp-${result.postcode}-${result.label}`"
            type="button"
            role="option"
            :aria-selected="idx === highlightedIndex"
            data-search-result
            class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
            :class="idx === highlightedIndex ? 'bg-accent' : ''"
            @mousedown.prevent="selectResult(result)"
          >
            <Hash class="size-4 text-muted-foreground" />
            {{ result.label }}
          </button>
        </div>

        <!-- Departments group -->
        <div v-if="groupedResults.departments.length > 0">
          <p class="px-3 py-1.5 text-xs font-medium text-muted-foreground" data-group-departments>
            {{ t('wizard.targeting.smartSearch.groupDepartments') }}
          </p>
          <button
            v-for="(result, idx) in groupedResults.departments"
            :key="`dept-${result.departmentCode}`"
            type="button"
            role="option"
            :aria-selected="(idx + postcodeOffset) === highlightedIndex"
            data-search-result
            class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
            :class="(idx + postcodeOffset) === highlightedIndex ? 'bg-accent' : ''"
            @mousedown.prevent="selectResult(result)"
          >
            <MapPin class="size-4 text-muted-foreground" />
            {{ result.label }}
          </button>
        </div>

        <!-- Addresses group -->
        <div v-if="groupedResults.addresses.length > 0">
          <p class="px-3 py-1.5 text-xs font-medium text-muted-foreground" data-group-addresses>
            {{ t('wizard.targeting.smartSearch.groupAddresses') }}
          </p>
          <button
            v-for="(result, idx) in groupedResults.addresses"
            :key="`addr-${result.lat}-${result.lng}`"
            type="button"
            role="option"
            :aria-selected="(idx + departmentOffset) === highlightedIndex"
            data-search-result
            class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
            :class="(idx + departmentOffset) === highlightedIndex ? 'bg-accent' : ''"
            @mousedown.prevent="selectResult(result)"
          >
            <Navigation class="size-4 text-muted-foreground" />
            {{ result.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Address recap + radius slider -->
    <template v-if="showAddressControls">
      <Card data-address-recap class="border-primary/20 bg-primary/5">
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
    </template>
  </div>
</template>

<style scoped>
@import '../../assets/badge-transition.css';
</style>
