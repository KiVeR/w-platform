<script setup lang="ts">
import { Router } from 'lucide-vue-next'
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
  <div data-admin-page="routers" class="space-y-6">
    <div class="max-w-3xl space-y-2">
      <h1 class="text-2xl font-bold text-foreground">
        {{ t('admin.routers.title') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t('admin.routers.description') }}
      </p>
    </div>

    <Card class="border-dashed">
      <CardHeader>
        <CardTitle>{{ t('admin.backendRequired') }}</CardTitle>
        <CardDescription>{{ t('admin.routers.backendDescription') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          :icon="Router"
          :title="t('admin.routers.placeholderTitle')"
          :description="t('admin.routers.placeholderDescription')"
          :action-label="t('admin.backToDashboard')"
          action-to="/"
        />
      </CardContent>
    </Card>
  </div>
</template>
