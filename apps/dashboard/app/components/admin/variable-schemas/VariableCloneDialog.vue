<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { VariableSchema } from '@/types/admin'

const props = defineProps<{
  open: boolean
  schema: VariableSchema | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

const { t } = useI18n()

function close(): void {
  emit('update:open', false)
}

function confirm(): void {
  emit('confirm')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent data-variable-clone-dialog class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('admin.variableSchemas.cloneDialog.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('admin.variableSchemas.cloneDialog.description', { name: schema?.name ?? '—' }) }}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" @click="close">
          {{ t('admin.variableSchemas.cloneDialog.cancel') }}
        </Button>
        <Button
          data-variable-clone-confirm
          :disabled="isLoading"
          @click="confirm"
        >
          {{ t('admin.variableSchemas.cloneDialog.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
