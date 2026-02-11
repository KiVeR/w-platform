<script setup lang="ts">
import { computed } from 'vue'
import { Check, Circle } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useCampaignWizardStore } from '@/stores/campaignWizard'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const checklist = computed(() =>
  wizard.STEPS.slice(0, 5).map((step, i) => ({
    labelKey: step.labelKey,
    valid: wizard.stepValidation[i],
    visited: i <= wizard.currentStep,
  })),
)
</script>

<template>
  <div class="space-y-4">
    <!-- SMS Preview compact -->
    <Card data-sidebar-preview>
      <CardContent class="p-3">
        <div class="overflow-hidden rounded-lg bg-white dark:bg-white" style="height: 320px;">
          <div style="height: calc(320px / 0.7); transform: scale(0.7); transform-origin: top center;">
            <SmsPreview
              :sender="wizard.campaign.sender || 'SMS'"
              :message="wizard.campaign.message"
              :placeholder="t('wizard.message.previewEmpty')"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Mini checklist -->
    <Card data-sidebar-checklist>
      <CardHeader class="pb-2">
        <CardTitle class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {{ t('wizard.sidebar.progress') }}
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-1.5">
        <div
          v-for="(item, i) in checklist"
          :key="i"
          class="flex items-center gap-2 text-xs"
          :data-checklist-item="i"
        >
          <Check v-if="item.valid" class="size-3.5 text-success-500" />
          <Circle v-else class="size-3.5" :class="item.visited ? 'text-muted-foreground' : 'text-muted-foreground/40'" />
          <span :class="item.valid ? 'text-foreground' : 'text-muted-foreground'">
            {{ t(item.labelKey) }}
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
