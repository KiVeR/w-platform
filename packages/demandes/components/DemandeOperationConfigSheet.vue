<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { DemandeOperationRow } from '#demandes/types/demandes'

interface OperationDetail {
  id: number
  ref_operation: string
  line_number: number
  type: string
  name: string
  advertiser: string | null
  priority: string | null
  lifecycle_status: string
  last_transitioned_at: string | null
  created_at: string
  external_ref?: string | null
  message?: string | null
  sender?: string | null
  volume_estimated?: number | null
  scheduled_at?: string | null
  unit_price?: number | null
}

const props = defineProps<{
  operation: DemandeOperationRow | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const { t } = useI18n()
const { $api } = useNuxtApp()

const isLoadingDetail = ref(false)
const isSaving = ref(false)
const operationDetail = ref<OperationDetail | null>(null)

const form = reactive({
  name: '',
  advertiser: '',
  priority: 'medium' as string,
  external_ref: '',
  message: '',
  sender: '',
  volume_estimated: null as number | null,
  scheduled_at: '',
  unit_price: null as number | null,
})

const operationType = computed(() =>
  (operationDetail.value?.type ?? props.operation?.type ?? '').toLowerCase()
)

const showMessageFields = computed(() =>
  ['loc', 'fid', 'rloc', 'acq', 'rep'].includes(operationType.value)
)
const showTargetingFields = computed(() =>
  ['loc', 'rloc', 'acq', 'qual', 'rep'].includes(operationType.value)
)
const showSchedulingFields = computed(() =>
  ['loc', 'fid', 'rloc', 'acq', 'rep'].includes(operationType.value)
)
const showBillingFields = computed(() =>
  !['enrich', 'valid', 'filtre'].includes(operationType.value)
)

const charCount = computed(() => form.message.length)

const totalPrice = computed(() => {
  if (form.unit_price !== null && form.volume_estimated !== null) {
    return (form.unit_price * form.volume_estimated).toFixed(2)
  }
  return null
})

const statusClass = computed(() => {
  const status = props.operation?.lifecycle_status ?? ''
  return {
    'bg-green-100 text-green-800': status === 'completed',
    'bg-yellow-100 text-yellow-800': status === 'on_hold',
    'bg-blue-100 text-blue-800': status === 'in_progress',
    'bg-gray-100 text-gray-800': !['completed', 'on_hold', 'in_progress'].includes(status),
  }
})

function initForm(detail: OperationDetail) {
  form.name = detail.name ?? ''
  form.advertiser = detail.advertiser ?? ''
  form.priority = detail.priority ?? 'medium'
  form.external_ref = detail.external_ref ?? ''
  form.message = detail.message ?? ''
  form.sender = detail.sender ?? ''
  form.volume_estimated = detail.volume_estimated ?? null
  form.scheduled_at = detail.scheduled_at ?? ''
  form.unit_price = detail.unit_price ?? null
}

async function fetchDetail(id: number) {
  isLoadingDetail.value = true
  operationDetail.value = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await ($api as any).GET('/operations/{id}', {
      params: { path: { id }, query: { include: 'demande,campaign' } },
    })
    if (!error && data) {
      operationDetail.value = data as OperationDetail
      initForm(data as OperationDetail)
    }
  } finally {
    isLoadingDetail.value = false
  }
}

watch(
  () => props.operation,
  (op) => {
    if (op) {
      fetchDetail(op.id)
    }
  },
  { immediate: true }
)

async function save() {
  if (!operationDetail.value) return
  isSaving.value = true
  try {
    const payload: Record<string, unknown> = {
      name: form.name,
      advertiser: form.advertiser || null,
      priority: form.priority,
      external_ref: form.external_ref || null,
    }
    if (showMessageFields.value) {
      payload.message = form.message || null
      payload.sender = form.sender || null
    }
    if (showTargetingFields.value) {
      payload.volume_estimated = form.volume_estimated
    }
    if (showSchedulingFields.value) {
      payload.scheduled_at = form.scheduled_at || null
    }
    if (showBillingFields.value) {
      payload.unit_price = form.unit_price
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await ($api as any).PUT('/operations/{id}', {
      params: { path: { id: operationDetail.value.id } },
      body: payload,
    })
    if (error) {
      toast.error(t('demandes.config.save_error'))
      return
    }
    toast.success(t('demandes.config.saved'))
    emit('saved')
    emit('update:open', false)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="open"
      class="fixed inset-0 bg-black/50 z-40"
      data-testid="sheet-backdrop"
      @click="$emit('update:open', false)"
    />

    <!-- Sheet panel -->
    <div
      v-if="open"
      class="fixed inset-y-0 right-0 w-[420px] bg-background border-l shadow-lg z-50 flex flex-col"
      data-testid="config-sheet"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b" data-testid="sheet-header">
        <div class="flex items-center gap-2">
          <span class="font-mono text-sm" data-testid="sheet-ref">{{ operation?.ref_operation }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-muted" data-testid="sheet-type">{{ operation?.type }}</span>
          <span
            class="text-xs px-2 py-0.5 rounded-full"
            :class="statusClass"
            data-testid="sheet-status"
          >{{ operation?.lifecycle_status }}</span>
        </div>
        <button
          class="text-muted-foreground hover:text-foreground"
          data-testid="sheet-close-btn"
          @click="$emit('update:open', false)"
        >✕</button>
      </div>

      <!-- Body: scrollable sections -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6" data-testid="sheet-body">
        <!-- Loading -->
        <div v-if="isLoadingDetail" class="text-center py-8 text-muted-foreground" data-testid="sheet-loading">
          ...
        </div>

        <!-- Sections conditionnelles -->
        <template v-else-if="operationDetail">
          <!-- Section Identité (toujours) -->
          <div class="space-y-3" data-testid="section-identity">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {{ t('demandes.config.sections.identity') }}
            </h3>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.name') }}
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background"
                data-testid="field-name"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.advertiser') }}
              </label>
              <input
                v-model="form.advertiser"
                type="text"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background"
                data-testid="field-advertiser"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.priority') }}
              </label>
              <div class="flex items-center gap-3" data-testid="field-priority">
                <label v-for="p in ['high', 'medium', 'low']" :key="p" class="flex items-center gap-1.5 cursor-pointer">
                  <input v-model="form.priority" type="radio" :value="p" class="accent-primary" />
                  <span class="text-xs">{{ p }}</span>
                </label>
              </div>
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.external_ref') }}
              </label>
              <input
                v-model="form.external_ref"
                type="text"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background"
                data-testid="field-external-ref"
              />
            </div>
          </div>

          <!-- Section Message SMS -->
          <div v-if="showMessageFields" class="space-y-3" data-testid="section-message">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {{ t('demandes.config.sections.message') }}
            </h3>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.message') }}
              </label>
              <textarea
                v-model="form.message"
                rows="4"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background resize-none"
                data-testid="field-message"
              />
              <p class="text-xs text-muted-foreground text-right" data-testid="chars-count">
                {{ t('demandes.config.chars_count', { count: charCount }) }}
              </p>
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.sender') }}
              </label>
              <input
                v-model="form.sender"
                type="text"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background"
                data-testid="field-sender"
              />
            </div>
          </div>

          <!-- Section Ciblage & Volume -->
          <div v-if="showTargetingFields" class="space-y-3" data-testid="section-targeting">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {{ t('demandes.config.sections.targeting') }}
            </h3>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.volume_estimated') }}
              </label>
              <input
                v-model.number="form.volume_estimated"
                type="number"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background"
                data-testid="field-volume-estimated"
              />
            </div>
            <a href="#" class="text-xs text-primary underline" data-testid="configure-targeting-link">
              {{ t('demandes.config.fields.configure_targeting') }}
            </a>
          </div>

          <!-- Section Planification -->
          <div v-if="showSchedulingFields" class="space-y-3" data-testid="section-scheduling">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {{ t('demandes.config.sections.scheduling') }}
            </h3>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.scheduled_at') }}
              </label>
              <input
                v-model="form.scheduled_at"
                type="datetime-local"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background"
                data-testid="field-scheduled-at"
              />
            </div>
          </div>

          <!-- Section Tarification -->
          <div v-if="showBillingFields" class="space-y-3" data-testid="section-billing">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {{ t('demandes.config.sections.billing') }}
            </h3>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.unit_price') }}
              </label>
              <input
                v-model.number="form.unit_price"
                type="number"
                step="0.0001"
                class="w-full border rounded px-3 py-1.5 text-sm bg-background"
                data-testid="field-unit-price"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">
                {{ t('demandes.config.fields.total_price') }}
              </label>
              <input
                :value="totalPrice ?? ''"
                type="text"
                readonly
                class="w-full border rounded px-3 py-1.5 text-sm bg-muted cursor-not-allowed"
                data-testid="field-total-price"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 p-4 border-t" data-testid="sheet-footer">
        <button
          class="px-4 py-2 text-sm border rounded hover:bg-muted"
          data-testid="sheet-cancel-btn"
          @click="$emit('update:open', false)"
        >{{ t('demandes.config.close_button') }}</button>
        <button
          class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          :disabled="isSaving"
          data-testid="sheet-save-btn"
          @click="save"
        >{{ t('demandes.config.save_button') }}</button>
      </div>
    </div>
  </Teleport>
</template>
