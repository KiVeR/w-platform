<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Loader2, Layers } from 'lucide-vue-next'
import { Badge } from '#targeting/components/ui/badge'
import { Input } from '#targeting/components/ui/input'
import { Checkbox } from '#targeting/components/ui/checkbox'
import { useGeoSearchInput } from '#targeting/composables/useGeoSearchInput'
import type { CommuneSearchResult } from '#targeting/types/targeting'

const props = defineProps<{
  modelValue: string[]
  apiBaseUrl?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { t } = useI18n()
const selectedSet = computed(() => new Set(props.modelValue))

// Step 2: IRIS zones for selected commune
const selectedCommune = ref<CommuneSearchResult | null>(null)
const irisZones = ref<Array<{ code: string, name: string, commune_name: string }>>([])
const isLoadingIris = ref(false)

async function selectCommune(commune: CommuneSearchResult) {
  selectedCommune.value = commune

  // Fetch IRIS zones for this commune
  isLoadingIris.value = true
  try {
    const response = await fetch(
      `${props.apiBaseUrl || '/api'}/iris-zones?filter[commune_code]=${commune.code}`,
    )
    if (response.ok) {
      const data = await response.json()
      irisZones.value = (data.data || []).map((z: { code: string, name: string, commune_name: string }) => ({
        code: z.code,
        name: z.name,
        commune_name: z.commune_name,
      }))
    }
  }
  catch {
    irisZones.value = []
  }
  finally {
    isLoadingIris.value = false
  }
}

// Step 1: Commune search (shared composable handles input, dropdown, keyboard)
const {
  inputValue: communeInputValue, showDropdown: showCommuneDropdown,
  results: communeResults, isSearching: isCommuneSearching,
  highlightedIndex, handleSelect: handleCommuneSelect,
  handleInput: handleCommuneInput,
  handleKeydown: handleCommuneKeydown, handleBlur: handleCommuneBlur,
} = useGeoSearchInput(selectCommune)

function toggleIrisZone(code: string) {
  if (selectedSet.value.has(code)) {
    emit('update:modelValue', props.modelValue.filter(c => c !== code))
  }
  else {
    emit('update:modelValue', [...props.modelValue, code])
  }
}

function removeIrisCode(code: string) {
  emit('update:modelValue', props.modelValue.filter(c => c !== code))
}

const selectAllChecked = computed(() => {
  if (irisZones.value.length === 0) return false
  return irisZones.value.every(z => selectedSet.value.has(z.code))
})

function toggleSelectAll() {
  if (selectAllChecked.value) {
    const irisCodes = new Set(irisZones.value.map(z => z.code))
    emit('update:modelValue', props.modelValue.filter(c => !irisCodes.has(c)))
  }
  else {
    const existing = new Set(props.modelValue)
    const newCodes = irisZones.value.map(z => z.code).filter(c => !existing.has(c))
    emit('update:modelValue', [...props.modelValue, ...newCodes])
  }
}
</script>

<template>
  <div data-iris-selector class="space-y-3">
    <!-- Selected IRIS badges -->
    <TransitionGroup
      v-if="modelValue.length > 0"
      tag="div"
      name="badge"
      class="flex flex-wrap gap-1.5"
    >
      <Badge
        v-for="code in modelValue"
        :key="code"
        variant="secondary"
        class="gap-1 pr-1"
        data-iris-chip
      >
        {{ code }}
        <button
          data-remove-iris
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          @click="removeIrisCode(code)"
        >
          <X class="size-3" />
        </button>
      </Badge>
    </TransitionGroup>

    <!-- Step 1: Commune search -->
    <div class="relative">
      <Input
        v-model="communeInputValue"
        data-iris-commune-field
        role="combobox"
        :aria-expanded="showCommuneDropdown && communeResults.length > 0"
        aria-controls="iris-commune-listbox"
        :placeholder="t('wizard.targeting.iris.searchCommune')"
        @input="handleCommuneInput"
        @keydown="handleCommuneKeydown"
        @blur="handleCommuneBlur"
      />

      <div
        v-if="showCommuneDropdown && (communeResults.length > 0 || isCommuneSearching)"
        id="iris-commune-listbox"
        role="listbox"
        class="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
        data-iris-commune-dropdown
      >
        <div v-if="isCommuneSearching" class="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <Loader2 class="size-3 animate-spin" />
          <span>{{ t('wizard.targeting.iris.searching') }}</span>
        </div>
        <button
          v-for="(commune, idx) in communeResults"
          :key="commune.code"
          type="button"
          role="option"
          :aria-selected="idx === highlightedIndex"
          data-iris-commune-option
          class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          :class="idx === highlightedIndex ? 'bg-accent' : ''"
          @mousedown.prevent="handleCommuneSelect(commune)"
        >
          <span>{{ commune.nom }} <span class="text-muted-foreground">({{ commune.code }})</span></span>
          <span v-if="commune.population" class="text-xs text-muted-foreground">
            {{ commune.population.toLocaleString('fr-FR') }} hab.
          </span>
        </button>
      </div>
    </div>

    <!-- Step 2: IRIS zone checkboxes -->
    <div v-if="isLoadingIris" class="flex items-center gap-2 text-sm text-muted-foreground" data-iris-loading>
      <Loader2 class="size-4 animate-spin" />
      <span>{{ t('wizard.targeting.iris.loading') }}</span>
    </div>

    <div v-if="selectedCommune && irisZones.length > 0 && !isLoadingIris" class="space-y-2" data-iris-zone-list>
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium">
          {{ t('wizard.targeting.iris.selectZones') }} — {{ selectedCommune.nom }}
        </p>
        <button
          type="button"
          class="text-xs text-primary hover:underline"
          data-iris-select-all
          @click="toggleSelectAll"
        >
          {{ selectAllChecked ? t('wizard.targeting.department.deselectAll') : t('wizard.targeting.department.selectAll') }}
        </button>
      </div>

      <div class="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
        <label
          v-for="zone in irisZones"
          :key="zone.code"
          class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
          data-iris-zone-item
        >
          <Checkbox
            :checked="selectedSet.has(zone.code)"
            @update:checked="toggleIrisZone(zone.code)"
          />
          <Layers class="size-3 text-muted-foreground" />
          <span>{{ zone.name }}</span>
          <span class="text-xs text-muted-foreground">({{ zone.code }})</span>
        </label>
      </div>
    </div>

    <div v-if="selectedCommune && irisZones.length === 0 && !isLoadingIris" class="text-sm text-muted-foreground">
      {{ t('wizard.targeting.iris.noResults') }}
    </div>

    <p class="text-xs text-muted-foreground">
      {{ t('wizard.targeting.iris.selected', { count: modelValue.length }) }}
    </p>
  </div>
</template>

<style scoped>
@import '../../assets/badge-transition.css';
</style>
