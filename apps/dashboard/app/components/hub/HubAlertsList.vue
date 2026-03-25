<script setup lang="ts">
import { AlertTriangle, ArrowRight } from 'lucide-vue-next'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useScopedNavigation } from '@/composables/useScopedNavigation'
import type { PartnerAlert } from '@/types/hub'

defineProps<{
  alerts: PartnerAlert[]
  loading?: boolean
}>()

const { t } = useI18n()
const { enterPartner } = useScopedNavigation()
</script>

<template>
  <Card data-hub-alerts-list>
    <CardHeader class="pb-3">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t('hub.alerts.title') }}
      </h2>
    </CardHeader>

    <CardContent class="space-y-3">
      <template v-if="loading">
        <Skeleton
          v-for="i in 3"
          :key="i"
          class="h-12 w-full"
        />
      </template>

      <template v-else-if="alerts.length === 0">
        <p
          data-hub-alerts-empty
          class="py-4 text-center text-sm text-muted-foreground"
        >
          {{ t('hub.alerts.empty') }}
        </p>
      </template>

      <template v-else>
        <div
          v-for="alert in alerts"
          :key="`${alert.partnerId}-${alert.type}`"
          data-hub-alert-item
          class="flex items-center gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3"
        >
          <AlertTriangle class="size-4 shrink-0 text-warning-600" />

          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-foreground">
              {{ alert.partnerName }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ alert.message }}
            </p>
          </div>

          <Button
            data-hub-alert-enter
            variant="ghost"
            size="sm"
            @click="enterPartner(alert.partnerId, alert.partnerName)"
          >
            {{ t('hub.alerts.enter') }}
            <ArrowRight class="ml-1 size-3" />
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
