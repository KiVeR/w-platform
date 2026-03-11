<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertCircle, FileSpreadsheet } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { VariableSchemaForm } from '@/types/admin'

const props = defineProps<{
  open: boolean
  initialName?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [form: VariableSchemaForm]
}>()

const { t } = useI18n()
const { discoverFromCsv, isSaving } = useVariableSchemas()

const name = ref('')
const selectedFile = ref<File | null>(null)
const errorKey = ref<string | null>(null)
const isBackendPending = ref(false)

const submitDisabled = computed(() =>
  isSaving.value || name.value.trim().length === 0 || selectedFile.value === null,
)

watch(
  () => props.open,
  (open) => {
    if (!open) return

    name.value = props.initialName ?? ''
    selectedFile.value = null
    errorKey.value = null
    isBackendPending.value = false
  },
  { immediate: true },
)

function close(): void {
  emit('update:open', false)
}

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement | null
  selectedFile.value = target?.files?.[0] ?? null
  errorKey.value = null
  isBackendPending.value = false
}

async function handleSubmit(): Promise<void> {
  errorKey.value = null
  isBackendPending.value = false

  if (name.value.trim().length === 0) {
    errorKey.value = 'admin.variableSchemas.discoverDialog.validation.name'
    return
  }

  if (!selectedFile.value) {
    errorKey.value = 'admin.variableSchemas.discoverDialog.validation.file'
    return
  }

  const result = await discoverFromCsv(name.value.trim(), selectedFile.value)

  if (result === 'not_implemented') {
    isBackendPending.value = true
    return
  }

  if (!result) {
    errorKey.value = 'admin.variableSchemas.discoverDialog.error'
    return
  }

  emit('apply', result)
  close()
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent data-variable-discover-dialog class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t('admin.variableSchemas.discoverDialog.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('admin.variableSchemas.discoverDialog.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="schema-discover-name">
            {{ t('admin.variableSchemas.form.fields.name.label') }}
          </Label>
          <Input
            id="schema-discover-name"
            v-model="name"
            data-discover-name
            :placeholder="t('admin.variableSchemas.form.fields.name.placeholder')"
          />
        </div>

        <div class="space-y-2">
          <Label for="schema-discover-file">
            {{ t('admin.variableSchemas.discoverDialog.fileLabel') }}
          </Label>
          <Input
            id="schema-discover-file"
            data-discover-file
            type="file"
            accept=".csv,text/csv"
            @change="handleFileChange"
          />
          <p class="text-xs text-muted-foreground">
            {{ selectedFile?.name ?? t('admin.variableSchemas.discoverDialog.fileHint') }}
          </p>
        </div>

        <Alert v-if="isBackendPending" data-discover-backend-pending>
          <FileSpreadsheet class="size-4" />
          <AlertTitle>{{ t('admin.variableSchemas.discoverDialog.pending.title') }}</AlertTitle>
          <AlertDescription>
            {{ t('admin.variableSchemas.discoverDialog.pending.description') }}
          </AlertDescription>
        </Alert>

        <Alert v-else-if="errorKey" data-discover-error variant="destructive">
          <AlertCircle class="size-4" />
          <AlertTitle>{{ t('admin.variableSchemas.discoverDialog.errorTitle') }}</AlertTitle>
          <AlertDescription>{{ t(errorKey) }}</AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          {{ t('admin.variableSchemas.discoverDialog.cancel') }}
        </Button>
        <Button
          data-discover-submit
          :disabled="submitDisabled"
          @click="handleSubmit"
        >
          {{ isSaving ? t('admin.variableSchemas.discoverDialog.loading') : t('admin.variableSchemas.discoverDialog.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
