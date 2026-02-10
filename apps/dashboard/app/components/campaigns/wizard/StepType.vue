<script setup lang="ts">
import { Megaphone, Users, Calculator, Check } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import type { CampaignType } from '@/types/campaign'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const types = [
  { key: 'prospection' as CampaignType, icon: Megaphone, enabled: true },
  { key: 'fidelisation' as CampaignType, icon: Users, enabled: false },
  { key: 'comptage' as CampaignType, icon: Calculator, enabled: false },
]

function selectType(type: CampaignType) {
  wizard.campaign.type = type
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.type.title') }}</h2>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card
        v-for="item in types"
        :key="item.key"
        class="relative cursor-pointer transition-all"
        :class="[
          item.enabled && wizard.campaign.type === item.key
            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
            : '',
          !item.enabled ? 'pointer-events-none opacity-50' : 'hover:border-primary/50',
        ]"
        @click="item.enabled && selectType(item.key)"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <component :is="item.icon" class="size-8 text-primary" />
            <Check
              v-if="item.enabled && wizard.campaign.type === item.key"
              class="size-5 text-primary"
            />
            <Badge v-if="!item.enabled" variant="secondary">
              {{ t('wizard.type.comingSoon') }}
            </Badge>
          </div>
          <CardTitle class="mt-3">
            {{ t(`wizard.type.${item.key}.title`) }}
          </CardTitle>
          <CardDescription>
            {{ t(`wizard.type.${item.key}.description`) }}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
</template>
