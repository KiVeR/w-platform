<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCampaignWizardStore } from '@/stores/campaignWizard'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center gap-2">
        <BarChart3 class="size-4 text-primary" />
        <CardTitle class="text-sm">{{ t('wizard.estimate.title') }}</CardTitle>
      </div>
    </CardHeader>
    <CardContent class="space-y-3">
      <template v-if="wizard.estimate">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.type') }}</span>
          <span class="font-medium">{{ t(`campaigns.type.${wizard.campaign.type}`) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.volume') }}</span>
          <span class="font-medium">{{ wizard.estimate.volume.toLocaleString('fr-FR') }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.smsCount') }}</span>
          <span class="font-medium">{{ wizard.estimate.smsCount }}</span>
        </div>
        <Separator />
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.cost') }}</span>
          <span class="text-lg font-semibold text-primary">{{ formatEur(wizard.estimate.totalPrice) }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="i in 4" :key="i" class="flex items-center justify-between">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-16" />
        </div>
      </template>
    </CardContent>
  </Card>
</template>
