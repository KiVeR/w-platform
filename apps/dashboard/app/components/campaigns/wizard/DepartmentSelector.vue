<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import departments from '@/data/departments.json'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { t } = useI18n()
const search = ref('')

const filtered = computed(() => {
  if (!search.value) return departments
  const q = search.value.toLowerCase()
  return departments.filter(d =>
    d.name.toLowerCase().includes(q) || d.code.includes(q),
  )
})

function toggle(code: string) {
  if (props.modelValue.includes(code)) {
    emit('update:modelValue', props.modelValue.filter(c => c !== code))
  }
  else {
    emit('update:modelValue', [...props.modelValue, code])
  }
}

function remove(code: string) {
  emit('update:modelValue', props.modelValue.filter(c => c !== code))
}
</script>

<template>
  <div data-department-selector class="space-y-3">
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-1.5">
      <Badge
        v-for="code in modelValue"
        :key="code"
        variant="secondary"
        class="gap-1 pr-1"
      >
        {{ code }} — {{ departments.find(d => d.code === code)?.name }}
        <button
          data-remove-dept
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          @click="remove(code)"
        >
          <X class="size-3" />
        </button>
      </Badge>
    </div>

    <Input
      v-model="search"
      data-department-search
      :placeholder="t('wizard.targeting.department.search')"
    />

    <div class="max-h-48 overflow-y-auto rounded-md border">
      <div
        v-for="dept in filtered"
        :key="dept.code"
        data-dept-item
        class="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
        :class="modelValue.includes(dept.code) ? 'bg-primary/10 font-medium' : ''"
        @click="toggle(dept.code)"
      >
        <span class="w-8 font-mono text-xs text-muted-foreground">{{ dept.code }}</span>
        <span>{{ dept.name }}</span>
      </div>
      <p v-if="filtered.length === 0" class="p-3 text-center text-sm text-muted-foreground">
        {{ t('wizard.targeting.department.noResults') }}
      </p>
    </div>

    <p class="text-xs text-muted-foreground">
      {{ t('wizard.targeting.department.selected', { count: modelValue.length }) }}
    </p>
  </div>
</template>
