<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Check, ChevronsUpDown, X, Loader2, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ComboboxOption {
  id: number
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: number | null
  searchFn: (query: string) => Promise<ComboboxOption[]>
  placeholder?: string
  disabled?: boolean
  displayValue?: string
}>(), {
  placeholder: '',
  disabled: false,
  displayValue: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const open = ref(false)
const search = ref('')
const options = ref<ComboboxOption[]>([])
const isLoading = ref(false)
const selectedLabel = ref<string | undefined>(props.displayValue)

let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(() => props.displayValue, (val) => {
  if (val !== undefined) {
    selectedLabel.value = val
  }
})

// Debounced search — fires API call
watch(search, (value) => {
  clearTimeout(debounceTimer)
  if (value.length < 2) {
    options.value = []
    return
  }
  isLoading.value = true
  debounceTimer = setTimeout(() => fetchOptions(value), 300)
})

// Reset search when popover opens
watch(open, (value) => {
  if (value) {
    search.value = ''
    options.value = []
  }
})

async function fetchOptions(query: string) {
  try {
    options.value = await props.searchFn(query)
  } catch {
    options.value = []
  } finally {
    isLoading.value = false
  }
}

function selectOption(option: ComboboxOption) {
  emit('update:modelValue', option.id)
  selectedLabel.value = option.label
  open.value = false
}

function clear() {
  emit('update:modelValue', null)
  selectedLabel.value = undefined
  search.value = ''
  options.value = []
}

const buttonLabel = computed(() => {
  if (props.modelValue != null && selectedLabel.value) {
    return selectedLabel.value
  }
  return props.placeholder
})

const hasValue = computed(() => props.modelValue != null)

const showMinChars = computed(() => search.value.length > 0 && search.value.length < 2)
const showEmpty = computed(() => search.value.length >= 2 && !isLoading.value && options.value.length === 0)
</script>

<template>
  <div class="flex items-center gap-1" data-testid="async-combobox">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          :disabled="disabled"
          class="w-full justify-between"
          data-testid="combobox-trigger"
        >
          <span class="truncate" :class="{ 'text-muted-foreground': !hasValue }">
            {{ buttonLabel }}
          </span>
          <ChevronsUpDown class="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent class="w-[--reka-popover-trigger-width] p-0" align="start">
        <!-- Search input -->
        <div class="flex items-center border-b px-3 py-2">
          <Search class="mr-2 size-4 shrink-0 opacity-50" />
          <input
            v-model="search"
            type="text"
            class="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            :placeholder="placeholder"
            data-testid="combobox-search"
          />
        </div>

        <!-- Results list -->
        <div class="max-h-[200px] overflow-y-auto p-1">
          <!-- Loading -->
          <div
            v-if="isLoading"
            class="py-4 text-center text-sm text-muted-foreground"
            data-testid="combobox-loading"
          >
            <Loader2 class="mx-auto size-4 animate-spin" />
          </div>

          <!-- Min chars hint -->
          <div
            v-else-if="showMinChars"
            class="py-4 text-center text-sm text-muted-foreground"
            data-testid="combobox-min-chars"
          >
            {{ $t?.('common.minChars') ?? 'Type at least 2 characters' }}
          </div>

          <!-- No results -->
          <div
            v-else-if="showEmpty"
            class="py-4 text-center text-sm text-muted-foreground"
            data-testid="combobox-empty"
          >
            {{ $t?.('common.noResults') ?? 'No results found.' }}
          </div>

          <!-- Options -->
          <button
            v-for="option in options"
            :key="option.id"
            type="button"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            data-testid="combobox-option"
            @click="selectOption(option)"
          >
            <Check
              class="mr-2 size-4"
              :class="modelValue === option.id ? 'opacity-100' : 'opacity-0'"
            />
            {{ option.label }}
          </button>
        </div>
      </PopoverContent>
    </Popover>

    <Button
      v-if="hasValue"
      variant="ghost"
      size="icon"
      class="size-8 shrink-0"
      data-testid="combobox-clear"
      @click.stop="clear"
    >
      <X class="size-4" />
    </Button>
  </div>
</template>
