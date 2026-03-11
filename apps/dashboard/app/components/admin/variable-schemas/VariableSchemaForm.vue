<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertCircle, Database, FileText, Info, ListTodo, Plus, Sparkles, Trash2 } from 'lucide-vue-next'
import VariableDiscoverDialog from '@/components/admin/variable-schemas/VariableDiscoverDialog.vue'
import WizardStepper from '@/components/campaigns/wizard/WizardStepper.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import { createEmptyVariableSchemaForm } from '@/types/admin'
import type { VariableFieldForm, VariableSchema, VariableSchemaDataSet, VariableSchemaForm } from '@/types/admin'
import type { WizardStep } from '@/types/campaign'

const props = withDefaults(defineProps<{
  initialData?: VariableSchema | null
  mode?: 'create' | 'edit'
  isSaving?: boolean
}>(), {
  initialData: null,
  mode: 'create',
  isSaving: false,
})

const emit = defineEmits<{
  submit: [form: VariableSchemaForm]
}>()

const { t } = useI18n()
const auth = useAuthStore()
const partner = usePartnerStore()

const currentStep = ref(0)
const discoverOpen = ref(false)
const form = ref<VariableSchemaForm>(createEmptyVariableSchemaForm(partner.effectivePartnerId))
const globalJson = ref('')
const recipientJson = ref('')
const attemptedSteps = ref<number[]>([])

const steps: WizardStep[] = [
  { key: 'identity', labelKey: 'admin.variableSchemas.form.steps.identity', icon: FileText },
  { key: 'fields', labelKey: 'admin.variableSchemas.form.steps.fields', icon: ListTodo },
  { key: 'datasets', labelKey: 'admin.variableSchemas.form.steps.datasets', icon: Database },
]

const requiresPartnerScope = computed(() =>
  auth.isAdmin && props.mode === 'create' && partner.effectivePartnerId === null,
)

const sanitizedFields = computed<VariableFieldForm[]>(() =>
  form.value.fields
    .map(field => ({
      name: field.name.trim(),
      is_global: field.is_global,
      is_used: field.is_used,
    }))
    .filter(field => field.name.length > 0),
)

function formatJson(value: VariableSchemaDataSet | null): string {
  return value ? JSON.stringify(value, null, 2) : ''
}

function parseJson(value: string): { value: VariableSchemaDataSet | null, error: boolean } {
  if (value.trim().length === 0) {
    return { value: null, error: false }
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return { value: parsed as VariableSchemaDataSet, error: false }
    }

    return { value: null, error: true }
  }
  catch {
    return { value: null, error: true }
  }
}

const parsedGlobalData = computed(() => parseJson(globalJson.value))
const parsedRecipientPreviewData = computed(() => parseJson(recipientJson.value))

const validation = computed<boolean[]>(() => [
  form.value.name.trim().length > 0 && !requiresPartnerScope.value,
  sanitizedFields.value.length > 0,
  !parsedGlobalData.value.error && !parsedRecipientPreviewData.value.error,
])

const canGoPrevious = computed(() => currentStep.value > 0)
const isLastStep = computed(() => currentStep.value === steps.length - 1)

watch(
  () => props.initialData,
  (schema) => {
    if (schema) {
      form.value = {
        partner_id: schema.partner_id,
        name: schema.name,
        global_data: schema.global_data,
        recipient_preview_data: schema.recipient_preview_data,
        fields: schema.fields.map(field => ({
          name: field.name,
          is_global: field.is_global,
          is_used: field.is_used,
        })),
      }
      globalJson.value = formatJson(schema.global_data)
      recipientJson.value = formatJson(schema.recipient_preview_data)
      return
    }

    form.value = createEmptyVariableSchemaForm(partner.effectivePartnerId)
    globalJson.value = ''
    recipientJson.value = ''
  },
  { immediate: true },
)

watch(
  () => partner.effectivePartnerId,
  (partnerId) => {
    if (props.mode === 'create') {
      form.value.partner_id = partnerId
    }
  },
  { immediate: true },
)

function addAttemptedStep(index: number): void {
  if (!attemptedSteps.value.includes(index)) {
    attemptedSteps.value = [...attemptedSteps.value, index]
  }
}

function showError(index: number): boolean {
  return attemptedSteps.value.includes(index)
}

function addField(): void {
  form.value.fields.push({
    name: '',
    is_global: false,
    is_used: false,
  })
}

function removeField(index: number): void {
  form.value.fields.splice(index, 1)
}

function handleNext(): void {
  if (currentStep.value >= steps.length - 1) {
    return
  }

  addAttemptedStep(currentStep.value)
  if (!validation.value[currentStep.value]) {
    return
  }

  currentStep.value += 1
}

function handlePrevious(): void {
  if (!canGoPrevious.value) return
  currentStep.value -= 1
}

function handleStepChange(index: number): void {
  currentStep.value = index
}

function handleDiscoverApply(discovered: VariableSchemaForm): void {
  form.value = {
    partner_id: form.value.partner_id ?? discovered.partner_id,
    name: discovered.name,
    global_data: discovered.global_data,
    recipient_preview_data: discovered.recipient_preview_data,
    fields: discovered.fields.map(field => ({
      name: field.name,
      is_global: field.is_global,
      is_used: field.is_used,
    })),
  }
  globalJson.value = formatJson(discovered.global_data)
  recipientJson.value = formatJson(discovered.recipient_preview_data)
  currentStep.value = 1
}

function handleSubmit(): void {
  addAttemptedStep(2)
  if (validation.value.includes(false)) {
    return
  }

  emit('submit', {
    partner_id: form.value.partner_id,
    name: form.value.name.trim(),
    global_data: parsedGlobalData.value.value,
    recipient_preview_data: parsedRecipientPreviewData.value.value,
    fields: sanitizedFields.value,
  })
}
</script>

<template>
  <div data-variable-schema-form class="space-y-6">
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-foreground">
            {{ t(`admin.variableSchemas.form.mode.${mode}.title`) }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ t(`admin.variableSchemas.form.mode.${mode}.description`) }}
          </p>
        </div>
        <Badge variant="outline">
          {{ t('admin.variableSchemas.form.stepLabel', { current: currentStep + 1, total: steps.length }) }}
        </Badge>
      </div>

      <WizardStepper
        :steps="steps"
        :current-step="currentStep"
        :validation="validation"
        @step="handleStepChange"
      />
    </div>

    <Card v-if="currentStep === 0" data-schema-step="identity">
      <CardHeader>
        <CardTitle>{{ t('admin.variableSchemas.form.identity.title') }}</CardTitle>
        <CardDescription>{{ t('admin.variableSchemas.form.identity.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert v-if="requiresPartnerScope" data-schema-partner-warning variant="destructive">
          <AlertCircle class="size-4" />
          <AlertTitle>{{ t('admin.variableSchemas.form.partnerScope.title') }}</AlertTitle>
          <AlertDescription>{{ t('admin.variableSchemas.form.partnerScope.description') }}</AlertDescription>
        </Alert>

        <Alert v-else-if="auth.isAdmin && partner.currentPartnerName" data-schema-partner-scope>
          <Info class="size-4" />
          <AlertTitle>{{ t('admin.variableSchemas.form.partnerScope.scopedTitle') }}</AlertTitle>
          <AlertDescription>
            {{ t('admin.variableSchemas.form.partnerScope.scopedDescription', { name: partner.currentPartnerName }) }}
          </AlertDescription>
        </Alert>

        <div class="space-y-2">
          <Label for="variable-schema-name">
            {{ t('admin.variableSchemas.form.fields.name.label') }}
          </Label>
          <Input
            id="variable-schema-name"
            v-model="form.name"
            data-schema-name
            :placeholder="t('admin.variableSchemas.form.fields.name.placeholder')"
          />
          <p v-if="showError(0) && form.name.trim().length === 0" data-schema-name-error class="text-sm text-destructive">
            {{ t('admin.variableSchemas.form.fields.name.error') }}
          </p>
        </div>

        <Separator />

        <div class="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <p class="font-medium text-foreground">
              {{ t('admin.variableSchemas.form.identity.discoverTitle') }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ t('admin.variableSchemas.form.identity.discoverDescription') }}
            </p>
          </div>
          <Button
            data-schema-discover-open
            variant="outline"
            type="button"
            @click="discoverOpen = true"
          >
            <Sparkles class="mr-2 size-4" />
            {{ t('admin.variableSchemas.form.identity.discoverAction') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-else-if="currentStep === 1" data-schema-step="fields">
      <CardHeader>
        <CardTitle>{{ t('admin.variableSchemas.form.fieldsStep.title') }}</CardTitle>
        <CardDescription>{{ t('admin.variableSchemas.form.fieldsStep.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert>
          <Info class="size-4" />
          <AlertDescription>{{ t('admin.variableSchemas.form.fieldsStep.notice') }}</AlertDescription>
        </Alert>

        <div v-if="form.fields.length === 0" data-schema-fields-empty class="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
          {{ t('admin.variableSchemas.form.fieldsStep.empty') }}
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(field, index) in form.fields"
            :key="`${index}-${field.name}`"
            data-schema-field-row
            class="rounded-lg border bg-card p-4"
          >
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
              <div class="space-y-2">
                <Label :for="`field-name-${index}`">
                  {{ t('admin.variableSchemas.form.fieldsStep.fieldName') }}
                </Label>
                <Input
                  :id="`field-name-${index}`"
                  v-model="field.name"
                  data-schema-field-name
                  :placeholder="t('admin.variableSchemas.form.fieldsStep.fieldPlaceholder')"
                />
              </div>

              <div class="space-y-2">
                <Label :for="`field-global-${index}`">
                  {{ t('admin.variableSchemas.form.fieldsStep.fieldScope') }}
                </Label>
                <div class="flex min-h-10 items-center gap-3 rounded-md border px-3">
                  <Switch
                    :id="`field-global-${index}`"
                    v-model="field.is_global"
                    data-schema-field-global
                  />
                  <span class="text-sm text-foreground">
                    {{ field.is_global
                      ? t('admin.variableSchemas.form.fieldsStep.global')
                      : t('admin.variableSchemas.form.fieldsStep.recipient') }}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between gap-2 lg:justify-end">
                <Badge v-if="field.is_used" variant="secondary">
                  {{ t('admin.variableSchemas.form.fieldsStep.used') }}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-schema-field-remove
                  @click="removeField(index)"
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-3">
          <p v-if="showError(1) && sanitizedFields.length === 0" data-schema-fields-error class="text-sm text-destructive">
            {{ t('admin.variableSchemas.form.fieldsStep.error') }}
          </p>
          <Button type="button" variant="outline" data-schema-field-add @click="addField">
            <Plus class="mr-2 size-4" />
            {{ t('admin.variableSchemas.form.fieldsStep.add') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-else data-schema-step="datasets">
      <CardHeader>
        <CardTitle>{{ t('admin.variableSchemas.form.datasets.title') }}</CardTitle>
        <CardDescription>{{ t('admin.variableSchemas.form.datasets.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="space-y-2">
          <Label for="schema-global-data">
            {{ t('admin.variableSchemas.form.datasets.globalData') }}
          </Label>
          <Textarea
            id="schema-global-data"
            v-model="globalJson"
            data-schema-global-json
            rows="8"
            class="font-mono text-xs"
            :placeholder="t('admin.variableSchemas.form.datasets.globalPlaceholder')"
          />
          <p v-if="parsedGlobalData.error" data-schema-global-error class="text-sm text-destructive">
            {{ t('admin.variableSchemas.form.datasets.jsonError') }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="schema-recipient-preview">
            {{ t('admin.variableSchemas.form.datasets.recipientPreview') }}
          </Label>
          <Textarea
            id="schema-recipient-preview"
            v-model="recipientJson"
            data-schema-recipient-json
            rows="8"
            class="font-mono text-xs"
            :placeholder="t('admin.variableSchemas.form.datasets.recipientPlaceholder')"
          />
          <p v-if="parsedRecipientPreviewData.error" data-schema-recipient-error class="text-sm text-destructive">
            {{ t('admin.variableSchemas.form.datasets.jsonError') }}
          </p>
        </div>
      </CardContent>
    </Card>

    <div class="flex flex-col-reverse justify-between gap-3 border-t pt-4 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        :disabled="!canGoPrevious"
        @click="handlePrevious"
      >
        {{ t('admin.variableSchemas.form.previous') }}
      </Button>

      <Button
        v-if="!isLastStep"
        type="button"
        data-form-next
        @click="handleNext"
      >
        {{ t('admin.variableSchemas.form.next') }}
      </Button>

      <Button
        v-else
        type="button"
        data-form-submit
        :disabled="isSaving"
        @click="handleSubmit"
      >
        {{ isSaving
          ? t('admin.variableSchemas.form.saving')
          : t(`admin.variableSchemas.form.mode.${mode}.submit`) }}
      </Button>
    </div>

    <VariableDiscoverDialog
      :open="discoverOpen"
      :initial-name="form.name"
      @update:open="discoverOpen = $event"
      @apply="handleDiscoverApply"
    />
  </div>
</template>
