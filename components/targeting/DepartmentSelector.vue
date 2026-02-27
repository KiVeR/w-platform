<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, CheckSquare, Square } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import departments from '@/data/departments.json'

const departmentMap = new Map(departments.map(d => [d.code, d.name]))

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { t } = useI18n()
const selectedSet = computed(() => new Set(props.modelValue))
const search = ref('')

const filtered = computed(() => {
  if (!search.value) return departments
  const q = search.value.toLowerCase()
  return departments.filter(d =>
    d.name.toLowerCase().includes(q) || d.code.includes(q),
  )
})

function toggle(code: string) {
  const included = props.modelValue.includes(code)
  emit(
    'update:modelValue',
    included
      ? props.modelValue.filter(c => c !== code)
      : [...props.modelValue, code],
  )
}

function selectAll() {
  emit('update:modelValue', departments.map(d => d.code))
}

function deselectAll() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div data-department-selector class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-muted-foreground">
        {{ modelValue.length }} / {{ departments.length }}
      </span>
      <div class="flex gap-1">
        <Button
          data-select-all
          variant="ghost"
          size="sm"
          class="h-7 text-xs"
          @click="selectAll"
        >
          <CheckSquare class="mr-1 size-3.5" />
          {{ t('wizard.targeting.department.selectAll') }}
        </Button>
        <Button
          data-deselect-all
          variant="ghost"
          size="sm"
          class="h-7 text-xs"
          @click="deselectAll"
        >
          <Square class="mr-1 size-3.5" />
          {{ t('wizard.targeting.department.deselectAll') }}
        </Button>
      </div>
    </div>

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
        {{ code }} — {{ departmentMap.get(code) }}
        <button
          data-remove-dept
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          @click="toggle(code)"
        >
          <X class="size-3" />
        </button>
      </Badge>
    </TransitionGroup>

    <Input
      v-model="search"
      data-department-search
      :placeholder="t('wizard.targeting.department.search')"
    />

    <ScrollArea class="h-72 rounded-md border">
      <div class="p-1">
        <div
          v-for="dept in filtered"
          :key="dept.code"
          data-dept-item
          class="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
          :class="selectedSet.has(dept.code) ? 'bg-primary/5' : ''"
          @click="toggle(dept.code)"
        >
          <Checkbox
            :checked="selectedSet.has(dept.code)"
            class="pointer-events-none"
          />
          <span class="w-8 font-mono text-xs text-muted-foreground">{{ dept.code }}</span>
          <span class="flex-1">{{ dept.name }}</span>
        </div>
        <p v-if="filtered.length === 0" class="p-3 text-center text-sm text-muted-foreground">
          {{ t('wizard.targeting.department.noResults') }}
        </p>
      </div>
    </ScrollArea>

    <p class="text-xs text-muted-foreground">
      {{ t('wizard.targeting.department.selected', { count: modelValue.length }) }}
    </p>
  </div>
</template>

<style scoped>
@import '../../assets/badge-transition.css';
</style>
