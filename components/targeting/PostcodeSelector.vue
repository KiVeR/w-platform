<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useGeoSearchInput } from '@/composables/useGeoSearchInput'
import { isAlphaQuery } from '@/utils/commune-validation'
import type { CommuneSearchResult } from '@/types/targeting'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { t } = useI18n()
const error = ref('')

function selectCommune(commune: CommuneSearchResult) {
  const existing = new Set(props.modelValue)
  const newCodes = commune.codesPostaux.filter((cp: string) => !existing.has(cp))

  if (newCodes.length > 0) {
    emit('update:modelValue', [...props.modelValue, ...newCodes])
  }
}

const {
  inputValue, showDropdown, results: communeResults, isSearching,
  highlightedIndex, handleSelect: geoHandleSelect,
  handleInput: geoHandleInput, handleKeydown: geoHandleKeydown, handleBlur,
} = useGeoSearchInput(selectCommune)

const isCommuneMode = computed(() => isAlphaQuery(inputValue.value.trim()))

function addPostcodes(raw: string) {
  error.value = ''
  const codes = raw.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)

  if (codes.length === 0) return

  const valid: string[] = []
  for (const code of codes) {
    if (!/^\d{5}$/.test(code)) {
      error.value = t('wizard.targeting.postcode.invalid')
      continue
    }
    if (props.modelValue.includes(code) || valid.includes(code)) {
      if (codes.length === 1) error.value = t('wizard.targeting.postcode.duplicate')
      continue
    }
    valid.push(code)
  }

  if (valid.length > 0) {
    emit('update:modelValue', [...props.modelValue, ...valid])
    inputValue.value = ''
  }
}

function handleInput() {
  error.value = ''
  if (isCommuneMode.value) {
    geoHandleInput()
  }
  else {
    showDropdown.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (geoHandleKeydown(event)) return

  // Fallback: Enter adds postcodes when dropdown is closed
  if (event.key === 'Enter') {
    event.preventDefault()
    addPostcodes(inputValue.value)
  }
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (/[\s,;]/.test(text)) {
    event.preventDefault()
    addPostcodes(text)
  }
}

function remove(code: string) {
  emit('update:modelValue', props.modelValue.filter(c => c !== code))
}

</script>

<template>
  <div data-postcode-selector class="space-y-3">
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
      >
        {{ code }}
        <button
          data-remove-postcode
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
        data-postcode-field
        role="combobox"
        :aria-expanded="showDropdown && communeResults.length > 0"
        aria-controls="commune-listbox"
        :placeholder="t('wizard.targeting.postcode.placeholder')"
        :class="error ? 'border-destructive' : ''"
        @input="handleInput"
        @keydown="handleKeydown"
        @paste="onPaste"
        @blur="handleBlur"
      />

      <!-- Commune search dropdown -->
      <div
        v-if="showDropdown && isCommuneMode && (communeResults.length > 0 || isSearching)"
        id="commune-listbox"
        role="listbox"
        class="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
        data-commune-dropdown
      >
        <div v-if="isSearching" class="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <Loader2 class="size-3 animate-spin" />
          <span>{{ t('wizard.targeting.postcode.searching') }}</span>
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
          @mousedown.prevent="geoHandleSelect(commune)"
        >
          <span>{{ commune.nom }} <span class="text-muted-foreground">({{ commune.codesPostaux.join(', ') }})</span></span>
          <span v-if="commune.population" class="text-xs text-muted-foreground">
            {{ commune.population.toLocaleString('fr-FR') }} hab.
          </span>
        </button>
      </div>

      <p v-if="error" data-postcode-error class="mt-1 text-xs text-destructive">{{ error }}</p>
    </div>

    <p class="text-xs text-muted-foreground">
      {{ t('wizard.targeting.postcode.selected', { count: modelValue.length }) }}
    </p>
  </div>
</template>

<style scoped>
@import '@/assets/badge-transition.css';
</style>
