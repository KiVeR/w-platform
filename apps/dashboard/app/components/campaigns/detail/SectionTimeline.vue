<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronDown, Clock } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CollapsibleSection from '@/components/campaigns/detail/CollapsibleSection.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useCampaignActivities } from '@/composables/useCampaignActivities'
import { formatActivity, type ActivityTone } from '@/utils/activityFormatter'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  campaignId: number
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

const {
  activities,
  isLoading,
  hasError,
  fetchActivities,
} = useCampaignActivities(() => props.campaignId)

const expandedIds = ref<number[]>([])

const formattedActivities = computed(() => activities.value.map(activity => ({
  activity,
  formatted: formatActivity(activity, t),
  source: sourceLabel(activity.model_type),
})))

function sourceLabel(modelType: string | null): string {
  if (!modelType) {
    return t('campaigns.detail.timeline.source.system')
  }

  const modelName = modelType.split('\\').at(-1) ?? modelType

  switch (modelName) {
    case 'Campaign':
      return t('campaigns.detail.timeline.source.campaign')
    case 'CampaignRecipient':
      return t('campaigns.detail.timeline.source.recipient')
    case 'CampaignLog':
    case 'LogActivity':
      return t('campaigns.detail.timeline.source.log')
    default:
      return modelName
  }
}

function toneIconClass(tone: ActivityTone): string {
  switch (tone) {
    case 'success':
      return 'border-success-500/20 bg-success-50 text-success-700'
    case 'info':
      return 'border-primary/20 bg-primary/10 text-primary'
    case 'warning':
      return 'border-warning-500/20 bg-warning-50 text-warning-700'
    case 'danger':
      return 'border-destructive/20 bg-destructive/5 text-destructive'
    default:
      return 'border-border bg-muted/50 text-muted-foreground'
  }
}

function isExpanded(activityId: number): boolean {
  return expandedIds.value.includes(activityId)
}

function toggleExpanded(activityId: number): void {
  if (isExpanded(activityId)) {
    expandedIds.value = expandedIds.value.filter(id => id !== activityId)
    return
  }

  expandedIds.value = [...expandedIds.value, activityId]
}

onMounted(async () => {
  await fetchActivities()
})
</script>

<template>
  <CollapsibleSection
    :open="open"
    :title="t('campaigns.detail.timeline.title')"
    :badge="activities.length"
    :icon="Clock"
    :default-open="false"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <div v-if="hasError" data-timeline-error>
        <EmptyState
          :icon="Clock"
          :title="t('campaigns.detail.timeline.errorTitle')"
          :description="t('campaigns.detail.timeline.errorDescription')"
          :action-label="t('campaigns.detail.timeline.retry')"
          @action="fetchActivities"
        />
      </div>

      <div v-else-if="isLoading" data-timeline-loading class="space-y-3">
        <div
          v-for="index in 3"
          :key="index"
          class="h-24 rounded-xl border border-border/70 bg-muted/35"
        />
      </div>

      <EmptyState
        v-else-if="formattedActivities.length === 0"
        data-timeline-empty
        :icon="Clock"
        :title="t('campaigns.detail.timeline.emptyTitle')"
        :description="t('campaigns.detail.timeline.emptyDescription')"
      />

      <ol
        v-else
        data-timeline-list
        class="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-4 before:w-px before:bg-border"
      >
        <li
          v-for="entry in formattedActivities"
          :key="entry.activity.id"
          data-activity-row
          class="relative pl-12"
        >
          <span
            class="absolute top-1 left-0 flex size-8 items-center justify-center rounded-full border shadow-sm"
            :class="toneIconClass(entry.formatted.tone)"
          >
            <component :is="entry.formatted.icon" class="size-4" />
          </span>

          <div class="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" data-activity-source class="rounded-full px-2.5 py-0.5 text-xs">
                    {{ entry.source }}
                  </Badge>

                  <p data-activity-description class="text-sm font-medium text-foreground">
                    {{ entry.formatted.description }}
                  </p>
                </div>

                <p
                  class="text-sm text-muted-foreground"
                  :title="formatDateTime(entry.activity.created_at)"
                >
                  {{ formatDateTime(entry.activity.created_at) }}
                </p>
              </div>

              <Button
                v-if="entry.formatted.detail"
                data-activity-detail-toggle
                variant="ghost"
                size="sm"
                class="shrink-0"
                @click="toggleExpanded(entry.activity.id)"
              >
                {{ isExpanded(entry.activity.id) ? t('campaigns.detail.timeline.hideDetails') : t('campaigns.detail.timeline.showDetails') }}
                <ChevronDown
                  class="ml-2 size-4 transition-transform duration-200"
                  :class="{ 'rotate-180': isExpanded(entry.activity.id) }"
                />
              </Button>
            </div>

            <div
              v-if="entry.formatted.detail && isExpanded(entry.activity.id)"
              data-activity-detail
              class="mt-4 rounded-lg border border-border/70 bg-muted/40 p-3"
            >
              <p class="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {{ t('campaigns.detail.timeline.technicalDetails') }}
              </p>

              <pre class="overflow-x-auto whitespace-pre-wrap text-xs leading-5 font-mono">{{ entry.formatted.detail }}</pre>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </CollapsibleSection>
</template>
