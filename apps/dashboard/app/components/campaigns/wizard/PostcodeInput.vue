<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { t } = useI18n()
const inputValue = ref('')
const error = ref('')

function addPostcode() {
  const code = inputValue.value.trim()
  error.value = ''

  if (!/^\d{5}$/.test(code)) {
    error.value = t('wizard.targeting.postcode.invalid')
    return
  }

  if (props.modelValue.includes(code)) {
    error.value = t('wizard.targeting.postcode.duplicate')
    return
  }

  emit('update:modelValue', [...props.modelValue, code])
  inputValue.value = ''
}

function remove(code: string) {
  emit('update:modelValue', props.modelValue.filter(c => c !== code))
}
</script>

<template>
  <div data-postcode-input class="space-y-3">
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-1.5">
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
    </div>

    <div>
      <Input
        v-model="inputValue"
        data-postcode-field
        :placeholder="t('wizard.targeting.postcode.placeholder')"
        maxlength="5"
        @keydown.enter.prevent="addPostcode"
      />
      <p v-if="error" class="mt-1 text-xs text-destructive">{{ error }}</p>
    </div>

    <p class="text-xs text-muted-foreground">
      {{ t('wizard.targeting.postcode.selected', { count: modelValue.length }) }}
    </p>
  </div>
</template>
