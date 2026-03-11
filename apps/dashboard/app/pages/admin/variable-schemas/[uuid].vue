<script setup lang="ts">
import { computed, onMounted } from 'vue'
import VariableSchemaForm from '@/components/admin/variable-schemas/VariableSchemaForm.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import type { VariableSchemaForm as VariableSchemaFormPayload } from '@/types/admin'

const { t } = useI18n()
const route = useRoute()
const { current, isLoading, isSaving, fetchSchema, updateSchema } = useVariableSchemas()

definePageMeta({
  middleware: 'admin',
})

const uuid = computed(() => String(route.params.uuid ?? ''))

onMounted(async () => {
  if (!uuid.value) return
  await fetchSchema(uuid.value)
})

async function handleSubmit(payload: VariableSchemaFormPayload): Promise<void> {
  if (!uuid.value) return
  await updateSchema(uuid.value, payload)
}
</script>

<template>
  <div data-schema-editor-page="edit" class="space-y-6">
    <div class="max-w-3xl space-y-2">
      <h1 class="text-2xl font-bold text-foreground">
        {{ t('admin.variableSchemas.editPage.title') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t('admin.variableSchemas.editPage.description') }}
      </p>
      <p class="font-mono text-xs text-muted-foreground">
        {{ uuid }}
      </p>
    </div>

    <PageSkeleton v-if="isLoading" variant="table" />

    <EmptyState
      v-else-if="!current"
      data-schema-edit-empty
      :title="t('admin.variableSchemas.editPage.notFoundTitle')"
      :description="t('admin.variableSchemas.editPage.notFoundDescription')"
      :action-label="t('admin.variableSchemas.editPage.backToList')"
      action-to="/admin/variable-schemas"
    />

    <VariableSchemaForm
      v-else
      mode="edit"
      :initial-data="current"
      :is-saving="isSaving"
      @submit="handleSubmit"
    />
  </div>
</template>
