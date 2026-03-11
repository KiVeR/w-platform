<script setup lang="ts">
import { computed, ref } from 'vue'
import { MessageSquareText } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CampaignDetailEnriched } from '@/types/campaign'
import CollapsibleSection from '@/components/campaigns/detail/CollapsibleSection.vue'

const props = defineProps<{
  campaign: CampaignDetailEnriched
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const isExpanded = ref(false)

const message = computed(() => props.campaign.message ?? '')
const isLongMessage = computed(() => message.value.length > 150)
const displayedMessage = computed(() => {
  if (!message.value) return t('campaigns.detail.summary.emptyMessage')
  if (!isLongMessage.value || isExpanded.value) return message.value
  return `${message.value.slice(0, 150).trimEnd()}…`
})

function toggleMessage(): void {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <CollapsibleSection
    :open="open"
    :title="t('campaigns.detail.summary.message')"
    :badge="campaign.sms_count"
    :icon="MessageSquareText"
    :default-open="true"
    @update:open="emit('update:open', $event)"
  >
    <dl class="space-y-5 text-sm">
      <div class="grid gap-1.5">
        <dt class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {{ t('campaigns.detail.summary.sender') }}
        </dt>
        <dd class="font-medium text-foreground">
          {{ campaign.sender ?? '—' }}
        </dd>
      </div>

      <div class="grid gap-2">
        <div class="flex items-center justify-between gap-3">
          <dt class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {{ t('campaigns.detail.summary.message') }}
          </dt>

          <Badge variant="outline" class="rounded-full">
            {{ campaign.sms_count }}
          </Badge>
        </div>

        <dd class="rounded-xl bg-muted/40 p-4 leading-6 text-foreground" data-message-content>
          {{ displayedMessage }}
        </dd>

        <Button
          v-if="isLongMessage"
          variant="ghost"
          size="sm"
          data-message-toggle
          class="w-fit px-0 text-sm font-medium text-primary hover:bg-transparent hover:text-primary/80"
          @click="toggleMessage"
        >
          {{ isExpanded ? t('campaigns.detail.summary.showLess') : t('campaigns.detail.summary.showFull') }}
        </Button>
      </div>

      <div v-if="campaign.short_url" class="grid gap-1.5">
        <dt class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {{ t('campaigns.detail.summary.shortUrl') }}
        </dt>
        <dd>
          <a
            :href="campaign.short_url"
            target="_blank"
            rel="noopener"
            data-short-url
            class="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {{ campaign.short_url }}
          </a>
        </dd>
      </div>
    </dl>
  </CollapsibleSection>
</template>
