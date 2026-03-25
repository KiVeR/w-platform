<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  demandeId: number
}>()

const emit = defineEmits<{
  created: []
}>()

const { t } = useI18n()
const { $api } = useNuxtApp()

const isOpen = ref(false)
const isSubmitting = ref(false)
const selectedType = ref<string | null>(null)
const form = reactive({
  name: '',
  advertiser: '',
  priority: 'medium' as string,
})

const operationTypes = [
  { value: 'loc', label: 'LOC' },
  { value: 'fid', label: 'FID' },
  { value: 'rloc', label: 'RLOC' },
  { value: 'acq', label: 'ACQ' },
  { value: 'qual', label: 'QUAL' },
  { value: 'rep', label: 'REP' },
  { value: 'enrich', label: 'ENRICH' },
  { value: 'valid', label: 'VALID' },
  { value: 'filtre', label: 'FILTRE' },
]

const priorities = [
  { value: 'high', label: 'Haute', color: 'text-red-500' },
  { value: 'medium', label: 'Moyenne', color: 'text-orange-500' },
  { value: 'low', label: 'Basse', color: 'text-gray-400' },
]

const canSubmit = computed(() => selectedType.value !== null && form.name.trim() !== '')

function open() {
  isOpen.value = true
  selectedType.value = null
  form.name = ''
  form.advertiser = ''
  form.priority = 'medium'
}

function close() {
  isOpen.value = false
}

function selectType(value: string) {
  selectedType.value = value
}

async function submit() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await ($api as any).POST('/operations', {
      body: {
        demande_id: props.demandeId,
        type: selectedType.value,
        name: form.name,
        advertiser: form.advertiser || null,
        priority: form.priority,
      },
    })
    if (error) {
      toast.error(t('demandes.operations.create_error'))
      return
    }
    toast.success(t('demandes.operations.created'))
    close()
    emit('created')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div data-testid="operation-quick-create">
    <!-- Closed state: Add button -->
    <Button
      v-if="!isOpen"
      size="sm"
      variant="outline"
      data-testid="add-operation-btn"
      @click="open"
    >
      + {{ t('demandes.operations.add_button') }}
    </Button>

    <!-- Open state: inline form -->
    <div v-else class="border rounded-lg p-4 space-y-4 bg-muted/30" data-testid="quick-create-form">
      <!-- Type pills -->
      <div class="space-y-2">
        <p class="text-xs font-medium text-muted-foreground">{{ t('demandes.operations.type_placeholder') }}</p>
        <div class="flex flex-wrap gap-1.5" data-testid="type-pills">
          <button
            v-for="opType in operationTypes"
            :key="opType.value"
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded-full border transition-colors"
            :class="selectedType === opType.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:bg-muted'"
            :data-testid="`type-pill-${opType.value}`"
            @click="selectType(opType.value)"
          >
            {{ opType.label }}
          </button>
        </div>
      </div>

      <!-- Name input -->
      <div class="space-y-1">
        <Input
          v-model="form.name"
          type="text"
          :placeholder="t('demandes.operations.name_placeholder')"
          class="h-8 text-sm"
          data-testid="name-input"
        />
      </div>

      <!-- Advertiser input -->
      <div class="space-y-1">
        <Input
          v-model="form.advertiser"
          type="text"
          :placeholder="t('demandes.operations.advertiser_placeholder')"
          class="h-8 text-sm"
          data-testid="advertiser-input"
        />
      </div>

      <!-- Priority radio buttons -->
      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground">{{ t('demandes.operations.priority_label') }}</p>
        <div class="flex items-center gap-3" data-testid="priority-options">
          <label
            v-for="p in priorities"
            :key="p.value"
            class="flex items-center gap-1.5 cursor-pointer"
            :data-testid="`priority-option-${p.value}`"
          >
            <input
              v-model="form.priority"
              type="radio"
              :value="p.value"
              class="accent-primary"
            />
            <span class="text-xs" :class="p.color">{{ p.label }}</span>
          </label>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          :disabled="!canSubmit || isSubmitting"
          data-testid="submit-btn"
          @click="submit"
        >
          {{ t('demandes.operations.submit') }}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          data-testid="cancel-btn"
          @click="close"
        >
          {{ t('demandes.operations.cancel') }}
        </Button>
      </div>
    </div>
  </div>
</template>
