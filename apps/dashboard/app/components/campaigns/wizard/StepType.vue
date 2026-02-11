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
        class="group relative cursor-pointer transition-all duration-200"
        :class="[
          item.enabled && wizard.campaign.type === item.key
            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
            : '',
          item.enabled
            ? 'hover:scale-[1.02] hover:shadow-md hover:border-primary/50'
            : 'cursor-default',
        ]"
        @click="item.enabled && selectType(item.key)"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <component :is="item.icon" class="size-5 text-primary" />
            </div>
            <div class="flex items-center gap-2">
              <Badge v-if="item.key === 'prospection'" data-channel-badge variant="outline" class="text-xs">
                SMS
              </Badge>
              <Check
                v-if="item.enabled && wizard.campaign.type === item.key"
                class="size-5 text-primary"
              />
            </div>
          </div>
          <CardTitle class="mt-3">
            {{ t(`wizard.type.${item.key}.title`) }}
          </CardTitle>
          <CardDescription>
            {{ t(`wizard.type.${item.key}.description`) }}
          </CardDescription>
        </CardHeader>

        <!-- Disabled overlay -->
        <div
          v-if="!item.enabled"
          data-disabled-overlay
          class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-muted/60 backdrop-blur-[1px]"
        >
          <Badge variant="secondary">
            {{ t('wizard.type.comingSoon') }}
          </Badge>
        </div>
      </Card>
    </div>
  </div>
</template>
