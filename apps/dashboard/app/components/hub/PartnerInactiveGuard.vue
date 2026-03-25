<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { usePartnerStore } from '@/stores/partner'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const partner = usePartnerStore()
const auth = useAuthStore()

const isInactive = computed(() => partner.currentPartnerData?.is_active === false)
</script>

<template>
  <Alert
    v-if="isInactive"
    data-partner-inactive-guard
    variant="destructive"
    class="mb-4"
  >
    <AlertTriangle class="size-4" />
    <AlertTitle>{{ t('scope.inactive.title') }}</AlertTitle>
    <AlertDescription class="flex items-center justify-between">
      <span>{{ t('scope.inactive.description') }}</span>
      <Button
        v-if="auth.isAdmin"
        data-reactivate-btn
        variant="outline"
        size="sm"
      >
        {{ t('scope.inactive.reactivate') }}
      </Button>
    </AlertDescription>
  </Alert>
</template>
