<script setup lang="ts">
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import CampaignStatusBadge from '@/components/shared/CampaignStatusBadge.vue'
import { formatNumber, formatCurrency, formatDateTime } from '@/utils/format'
import type { CampaignDetail } from '@/types/campaign'

defineProps<{
  campaign: CampaignDetail
}>()

const { t } = useI18n()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base">{{ t('campaigns.detail.summary.title') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <dl class="space-y-3 text-sm">
        <div class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.type') }}</dt>
          <dd class="font-medium">
            {{ t(`campaigns.type.${campaign.type}`) }}
          </dd>
        </div>

        <div v-if="campaign.message" class="flex justify-between gap-4">
          <dt class="text-muted-foreground shrink-0">{{ t('campaigns.detail.summary.message') }}</dt>
          <dd class="font-medium text-right truncate max-w-[250px]" :title="campaign.message">
            {{ campaign.message }}
          </dd>
        </div>

        <div v-if="campaign.sender" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.sender') }}</dt>
          <dd class="font-medium">{{ campaign.sender }}</dd>
        </div>

        <div class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.columns.status') }}</dt>
          <dd>
            <CampaignStatusBadge :status="campaign.status" />
          </dd>
        </div>

        <div v-if="campaign.volume_estimated != null" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.volume') }}</dt>
          <dd class="font-medium">{{ formatNumber(campaign.volume_estimated) }}</dd>
        </div>

        <div v-if="campaign.volume_sent != null" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.volumeSent') }}</dt>
          <dd class="font-medium">{{ formatNumber(campaign.volume_sent) }}</dd>
        </div>

        <div v-if="campaign.sms_count > 1" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.smsCount') }}</dt>
          <dd class="font-medium">{{ campaign.sms_count }}</dd>
        </div>

        <div v-if="campaign.unit_price" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.unitPrice') }}</dt>
          <dd class="font-medium">{{ formatCurrency(Number(campaign.unit_price)) }}</dd>
        </div>

        <div v-if="campaign.total_price" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.totalPrice') }}</dt>
          <dd class="font-medium">{{ formatCurrency(Number(campaign.total_price)) }}</dd>
        </div>

        <div v-if="campaign.short_url" class="flex justify-between gap-4">
          <dt class="text-muted-foreground shrink-0">{{ t('campaigns.detail.summary.shortUrl') }}</dt>
          <dd class="font-medium truncate max-w-[200px]">
            <a :href="campaign.short_url" target="_blank" rel="noopener" class="text-primary hover:underline">
              {{ campaign.short_url }}
            </a>
          </dd>
        </div>

        <div class="border-t pt-3 flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.createdAt') }}</dt>
          <dd class="font-medium">{{ formatDateTime(campaign.created_at) }}</dd>
        </div>

        <div v-if="campaign.scheduled_at" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.scheduledAt') }}</dt>
          <dd class="font-medium">{{ formatDateTime(campaign.scheduled_at) }}</dd>
        </div>

        <div v-if="campaign.sent_at" class="flex justify-between">
          <dt class="text-muted-foreground">{{ t('campaigns.detail.summary.sentAt') }}</dt>
          <dd class="font-medium">{{ formatDateTime(campaign.sent_at) }}</dd>
        </div>
      </dl>
    </CardContent>
  </Card>
</template>
