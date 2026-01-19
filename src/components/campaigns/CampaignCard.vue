<script setup lang="ts">
import type { CampaignListItem } from '#shared/types/campaign'
import type { ContentType } from '#shared/types/content'
import { STATUS_COLORS, STATUS_LABELS } from '#shared/constants/status'
import { CONTENT_TYPE_EMOJI, CONTENT_TYPE_LABELS } from '#shared/types/content'
import { formatRelativeTime } from '@/utils/formatters'

const props = defineProps<{
  campaign: CampaignListItem
}>()

const emit = defineEmits<{
  click: [campaign: CampaignListItem]
  delete: [campaign: CampaignListItem]
}>()

function getContentCountByType(type: ContentType): number {
  return props.campaign.contentTypeSummary.filter(t => t === type).length
}

function handleClick() {
  emit('click', props.campaign)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.campaign)
}
</script>

<template>
  <div
    class="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md cursor-pointer"
    @click="handleClick"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-medium text-gray-900 truncate">
          {{ campaign.title }}
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ campaign._count.contents }} contenu{{ campaign._count.contents > 1 ? 's' : '' }}
          · Créé {{ formatRelativeTime(campaign.createdAt) }}
        </p>
      </div>

      <!-- Status badge -->
      <span
        class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="[
          STATUS_COLORS[campaign.status],
        ]"
      >
        {{ STATUS_LABELS[campaign.status] }}
      </span>
    </div>

    <!-- Content type badges -->
    <div class="flex flex-wrap gap-2">
      <div
        v-for="type in campaign.enabledContentTypes"
        :key="type"
        class="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs"
        :title="CONTENT_TYPE_LABELS[type]"
      >
        <span>{{ CONTENT_TYPE_EMOJI[type] }}</span>
        <span class="text-gray-600">
          {{ getContentCountByType(type) > 0 ? getContentCountByType(type) : '-' }}
        </span>
      </div>
    </div>

    <!-- Description (if exists) -->
    <p
      v-if="campaign.description"
      class="mt-3 text-sm text-gray-500 line-clamp-2"
    >
      {{ campaign.description }}
    </p>

    <!-- Actions (hidden by default, shown on hover) -->
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
        title="Supprimer"
        @click="handleDelete"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>
