<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DemandeOperationRow } from '#demandes/types/demandes'

const props = defineProps<{
  operations: DemandeOperationRow[]
}>()

const { $api } = useNuxtApp()
const { t, locale } = useI18n()

interface TimelineEntry {
  operationRef: string
  operationType: string
  track: string
  fromState: string
  toState: string
  userName: string | null
  createdAt: string
}

const PAGE_SIZE = 20

const allEntries = ref<TimelineEntry[]>([])
const isLoading = ref(false)
const visibleCount = ref(PAGE_SIZE)

const visibleEntries = computed(() => allEntries.value.slice(0, visibleCount.value))
const hasMore = computed(() => allEntries.value.length > visibleCount.value)

async function fetchAllTransitions() {
  if (props.operations.length === 0) {
    allEntries.value = []
    return
  }
  isLoading.value = true
  try {
    const collected: TimelineEntry[] = []
    for (const op of props.operations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await ($api as any).GET('/operations/{id}/transitions', {
        params: { path: { id: op.id } },
      })
      if (data?.data) {
        for (const tr of data.data as Record<string, unknown>[]) {
          // Filter to lifecycle track only by default
          if (String(tr.track ?? '') !== 'lifecycle') continue
          collected.push({
            operationRef: op.ref_operation,
            operationType: op.type,
            track: String(tr.track ?? ''),
            fromState: String(tr.from_state ?? ''),
            toState: String(tr.to_state ?? ''),
            userName: (tr.user as Record<string, unknown> | null)?.full_name
              ? String((tr.user as Record<string, unknown>).full_name)
              : null,
            createdAt: String(tr.created_at ?? ''),
          })
        }
      }
    }
    // Sort descending by date
    allEntries.value = collected.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    visibleCount.value = PAGE_SIZE
  }
  finally {
    isLoading.value = false
  }
}

function showMore() {
  visibleCount.value += PAGE_SIZE
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(() => props.operations, fetchAllTransitions, { immediate: true })
</script>

<template>
  <Card data-testid="demande-timeline">
    <CardHeader class="pb-3">
      <CardTitle class="text-base">{{ t('demandes.detail.tabs.timeline') }}</CardTitle>
    </CardHeader>

    <CardContent>
      <!-- Loading -->
      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-10 bg-muted animate-pulse rounded" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="visibleEntries.length === 0"
        class="text-center py-8 text-sm text-muted-foreground"
        data-testid="timeline-empty"
      >
        {{ t('demandes.timeline.empty') }}
      </div>

      <!-- Timeline -->
      <div v-else class="relative" data-testid="timeline-entries">
        <!-- Vertical connector line -->
        <div class="absolute left-3 top-4 bottom-4 w-px bg-border" aria-hidden="true" />

        <ol class="space-y-4">
          <li
            v-for="(entry, index) in visibleEntries"
            :key="`${entry.operationRef}-${entry.createdAt}-${index}`"
            class="flex gap-4 relative"
            data-testid="timeline-entry"
          >
            <!-- Dot -->
            <div class="flex-none w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 mt-0.5">
              <div class="w-2 h-2 rounded-full bg-primary" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 pb-1">
              <div class="flex items-start justify-between gap-2 flex-wrap">
                <div class="min-w-0">
                  <span class="text-xs font-mono text-muted-foreground" data-testid="entry-ref">
                    {{ entry.operationRef }}
                  </span>
                  <p class="text-sm font-medium" data-testid="entry-transition">
                    {{ t('demandes.timeline.transition', { from: entry.fromState, to: entry.toState }) }}
                  </p>
                  <p
                    v-if="entry.userName"
                    class="text-xs text-muted-foreground"
                    data-testid="entry-user"
                  >
                    {{ t('demandes.timeline.by', { name: entry.userName }) }}
                  </p>
                </div>
                <time class="text-xs text-muted-foreground whitespace-nowrap" :datetime="entry.createdAt" data-testid="entry-date">
                  {{ formatDate(entry.createdAt) }}
                </time>
              </div>
            </div>
          </li>
        </ol>

        <!-- See more -->
        <div v-if="hasMore" class="mt-4 text-center">
          <Button
            size="sm"
            variant="ghost"
            data-testid="see-more-button"
            @click="showMore"
          >
            {{ t('demandes.timeline.see_more') }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
