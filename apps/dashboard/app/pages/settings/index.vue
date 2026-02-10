<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<template>
  <div class="max-w-150">
    <h1 class="mb-6 text-2xl font-bold text-foreground">
      {{ t('settings.title') }}
    </h1>

    <Card>
      <CardHeader>
        <CardTitle>{{ t('settings.profile.title') }}</CardTitle>
        <CardDescription>{{ t('settings.profile.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>{{ t('settings.profile.firstname') }}</Label>
            <Input :model-value="auth.user?.firstname" disabled />
          </div>
          <div class="space-y-2">
            <Label>{{ t('settings.profile.lastname') }}</Label>
            <Input :model-value="auth.user?.lastname" disabled />
          </div>
        </div>
        <div class="space-y-2">
          <Label>{{ t('settings.profile.email') }}</Label>
          <Input :model-value="auth.user?.email" disabled />
        </div>
        <div class="space-y-2">
          <Label>{{ t('settings.profile.role') }}</Label>
          <div>
            <Badge variant="secondary">{{ auth.role }}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
