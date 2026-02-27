<script setup lang="ts">
import { X, Loader2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useGeoSearchInput } from '@/composables/useGeoSearchInput'
import type { CommuneSearchResult } from '@/types/targeting'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { t } = useI18n()

function selectCommune(commune: CommuneSearchResult) {
  if (!props.modelValue.includes(commune.code)) {
    emit('update:modelValue', [...props.modelValue, commune.code])
  }
}

const {
  inputValue, showDropdown, results: communeResults, isSearching,
  highlightedIndex, handleSelect, handleInput, handleKeydown, handleBlur,
} = useGeoSearchInput(selectCommune)

function remove(code: string) {
  emit('update:modelValue', props.modelValue.filter(c => c !== code))
}

</script>

<template>
  <div data-commune-selector class="space-y-3">
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
        data-commune-chip
      >
        {{ code }}
        <button
          data-remove-commune
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          @click="remove(code)"
        >
          <X class="size-3" />
        </button>
      </Badge>
    </TransitionGroup>

    <div class="relative">
      <Input
        v-model="inputValue"
        data-commune-field
        role="combobox"
        :aria-expanded="showDropdown && communeResults.length > 0"
        aria-controls="commune-insee-listbox"
        :placeholder="t('wizard.targeting.commune.placeholder')"
        @input="handleInput"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />

      <div
        v-if="showDropdown && (communeResults.length > 0 || isSearching)"
        id="commune-insee-listbox"
        role="listbox"
        class="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
        data-commune-dropdown
      >
        <div v-if="isSearching" class="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <Loader2 class="size-3 animate-spin" />
          <span>{{ t('wizard.targeting.commune.searching') }}</span>
        </div>
        <button
          v-for="(commune, idx) in communeResults"
          :key="commune.code"
          type="button"
          role="option"
          :aria-selected="idx === highlightedIndex"
          data-commune-option
          class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          :class="idx === highlightedIndex ? 'bg-accent' : ''"
          @mousedown.prevent="handleSelect(commune)"
        >
          <span>
            {{ commune.nom }}
            <span class="text-muted-foreground">(INSEE: {{ commune.code }})</span>
            <span v-if="commune.codesPostaux.length > 0" class="text-xs text-muted-foreground"> — {{ commune.codesPostaux[0].slice(0, 2) }}</span>
          </span>
          <span v-if="commune.population" class="text-xs text-muted-foreground">
            {{ commune.population.toLocaleString('fr-FR') }} hab.
          </span>
        </button>
      </div>
    </div>

    <p class="text-xs text-muted-foreground">
      {{ t('wizard.targeting.commune.selected', { count: modelValue.length }) }}
    </p>
  </div>
</template>

<style scoped>
@import '../../assets/badge-transition.css';
</style>
