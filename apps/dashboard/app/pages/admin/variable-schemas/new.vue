<script setup lang="ts">
import VariableSchemaForm from '@/components/admin/variable-schemas/VariableSchemaForm.vue'
import type { VariableSchemaForm as VariableSchemaFormPayload } from '@/types/admin'

const { t } = useI18n()
const { current, createSchema, isSaving } = useVariableSchemas()

definePageMeta({
  middleware: 'admin',
})

async function handleSubmit(payload: VariableSchemaFormPayload): Promise<void> {
  const created = await createSchema(payload)
  if (!created) return

  const targetUuid = current.value?.uuid
  if (targetUuid) {
    await navigateTo(`/admin/variable-schemas/${targetUuid}`)
    return
  }

  await navigateTo('/admin/variable-schemas')
}
</script>

<template>
  <div data-schema-editor-page="new" class="space-y-6">
    <div class="max-w-3xl space-y-2">
      <h1 class="text-2xl font-bold text-foreground">
        {{ t('admin.variableSchemas.newPage.title') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t('admin.variableSchemas.newPage.description') }}
      </p>
    </div>

    <VariableSchemaForm
      mode="create"
      :is-saving="isSaving"
      @submit="handleSubmit"
    />
  </div>
</template>
