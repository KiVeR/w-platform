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

definePageMeta({
  middleware: 'admin',
})
</script>

<template>
  <div data-admin-page="variable-schemas" class="space-y-6">
    <div class="max-w-3xl space-y-2">
      <h1 class="text-2xl font-bold text-foreground">
        {{ t('admin.variableSchemas.title') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t('admin.variableSchemas.description') }}
      </p>
    </div>

    <Card class="border-dashed">
      <CardHeader>
        <CardTitle>{{ t('admin.comingSoon') }}</CardTitle>
        <CardDescription>{{ t('admin.variableSchemas.launchDescription') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          :icon="FileCode"
          :title="t('admin.variableSchemas.placeholderTitle')"
          :description="t('admin.variableSchemas.placeholderDescription')"
        />
      </CardContent>
    </Card>
  </div>
</template>
