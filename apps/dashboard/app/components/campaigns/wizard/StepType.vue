<script setup lang="ts">
import { Megaphone, Check } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import type { CampaignType } from '@/types/campaign'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const types = [
  { key: 'prospection' as CampaignType, icon: Megaphone },
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
          wizard.campaign.type === item.key
            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
            : '',
          'hover:scale-[1.02] hover:shadow-md hover:border-primary/50',
        ]"
        @click="selectType(item.key)"
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
                v-if="wizard.campaign.type === item.key"
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
      </Card>
    </div>
  </div>
</template>
