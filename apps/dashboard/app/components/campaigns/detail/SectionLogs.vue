<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { FileText } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CollapsibleSection from '@/components/campaigns/detail/CollapsibleSection.vue'
import HttpLogDetailDialog from '@/components/campaigns/detail/HttpLogDetailDialog.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useCampaignLogs } from '@/composables/useCampaignLogs'
import type { CampaignLogRow } from '@/types/campaign'
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
  logs,
  isLoading,
  hasError,
  fetchLogs,
} = useCampaignLogs(() => props.campaignId)

const selectedLog = ref<CampaignLogRow | null>(null)
const isDialogOpen = ref(false)

const normalizedLogs = computed(() => logs.value.map(log => ({
  log,
  phase: stringField(log, 'phase') ?? 'unknown',
  level: stringField(log, 'level') ?? 'info',
  message: stringField(log, 'message') ?? '—',
  type: stringField(log, 'type') ?? stringField(log, 'event') ?? '—',
})))

function stringField(log: CampaignLogRow, key: string): string | null {
  const value = log.data[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

function phaseLabel(value: string): string {
  return t(`campaigns.detail.logs.phase.${value}`)
}

function levelLabel(value: string): string {
  return t(`campaigns.detail.logs.level.${value}`)
}

function phaseClass(value: string): string {
  switch (value) {
    case 'query':
      return 'border-primary/20 bg-primary/10 text-primary'
    case 'routing':
      return 'border-warning-500/20 bg-warning-50 text-warning-700'
    case 'sending':
      return 'border-success-500/20 bg-success-50 text-success-700'
    default:
      return 'border-border bg-muted/50 text-muted-foreground'
  }
}

function levelClass(value: string): string {
  switch (value) {
    case 'error':
      return 'border-destructive/20 bg-destructive/5 text-destructive'
    case 'warning':
      return 'border-warning-500/20 bg-warning-50 text-warning-700'
    default:
      return 'border-border bg-muted/50 text-muted-foreground'
  }
}

function truncateMessage(message: string): string {
  if (message.length <= 80) {
    return message
  }

  return `${message.slice(0, 80).trimEnd()}…`
}

function openDetails(log: CampaignLogRow): void {
  selectedLog.value = log
  isDialogOpen.value = true
}

function handleDialogOpen(value: boolean): void {
  isDialogOpen.value = value

  if (!value) {
    selectedLog.value = null
  }
}

onMounted(async () => {
  await fetchLogs()
})
</script>

<template>
  <CollapsibleSection
    :open="open"
    :title="t('campaigns.detail.logs.title')"
    :badge="logs.length"
    :icon="FileText"
    :default-open="false"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <div v-if="hasError" data-logs-error>
        <EmptyState
          :icon="FileText"
          :title="t('campaigns.detail.logs.errorTitle')"
          :description="t('campaigns.detail.logs.errorDescription')"
          :action-label="t('campaigns.detail.logs.retry')"
          @action="fetchLogs"
        />
      </div>

      <div v-else-if="isLoading" data-logs-loading class="space-y-3">
        <div
          v-for="index in 3"
          :key="index"
          class="h-18 rounded-xl border border-border/70 bg-muted/35"
        />
      </div>

      <EmptyState
        v-else-if="normalizedLogs.length === 0"
        data-logs-empty
        :icon="FileText"
        :title="t('campaigns.detail.logs.emptyTitle')"
        :description="t('campaigns.detail.logs.emptyDescription')"
      />

      <div v-else data-logs-table class="overflow-x-auto rounded-xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('campaigns.detail.logs.columns.date') }}</TableHead>
              <TableHead>{{ t('campaigns.detail.logs.columns.phase') }}</TableHead>
              <TableHead>{{ t('campaigns.detail.logs.columns.message') }}</TableHead>
              <TableHead>{{ t('campaigns.detail.logs.columns.type') }}</TableHead>
              <TableHead>{{ t('campaigns.detail.logs.columns.level') }}</TableHead>
              <TableHead class="text-right">{{ t('campaigns.detail.logs.columns.actions') }}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow
              v-for="entry in normalizedLogs"
              :key="entry.log.id"
            >
              <TableCell class="text-sm text-muted-foreground">
                {{ formatDateTime(entry.log.created_at) }}
              </TableCell>

              <TableCell>
                <Badge data-phase-badge variant="outline" :class="phaseClass(entry.phase)">
                  {{ phaseLabel(entry.phase) }}
                </Badge>
              </TableCell>

              <TableCell :title="entry.message" class="max-w-[420px] truncate">
                {{ truncateMessage(entry.message) }}
              </TableCell>

              <TableCell class="text-sm text-muted-foreground">
                {{ entry.type }}
              </TableCell>

              <TableCell>
                <Badge data-level-badge variant="outline" :class="levelClass(entry.level)">
                  {{ levelLabel(entry.level) }}
                </Badge>
              </TableCell>

              <TableCell class="text-right">
                <Button
                  data-log-details-button
                  size="sm"
                  variant="outline"
                  @click="openDetails(entry.log)"
                >
                  {{ t('campaigns.detail.logs.details') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <HttpLogDetailDialog
      :open="isDialogOpen"
      :log="selectedLog"
      @update:open="handleDialogOpen"
    />
  </CollapsibleSection>
</template>
