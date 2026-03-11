<script setup lang="ts">
import { FileCode } from 'lucide-vue-next'
import EmptyState from '@/components/shared/EmptyState.vue'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const { t } = useI18n()
const route = useRoute()

definePageMeta({
  middleware: 'admin',
})
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
        {{ route.params.uuid }}
      </p>
    </div>

    <Card class="border-dashed">
      <CardHeader>
        <CardTitle>{{ t('admin.comingSoon') }}</CardTitle>
        <CardDescription>{{ t('admin.variableSchemas.editorPlaceholder.description') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          :icon="FileCode"
          :title="t('admin.variableSchemas.editorPlaceholder.title')"
          :description="t('admin.variableSchemas.editorPlaceholder.body')"
          :action-label="t('admin.variableSchemas.editorPlaceholder.backToList')"
          action-to="/admin/variable-schemas"
        />
      </CardContent>
    </Card>
  </div>
</template>
