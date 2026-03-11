<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CampaignLogRow } from '@/types/campaign'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  open: boolean
  log: CampaignLogRow | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

const phase = computed(() => {
  const value = props.log?.data.phase
  return typeof value === 'string' && value.length > 0 ? value : 'unknown'
})

const level = computed(() => {
  const value = props.log?.data.level
  return typeof value === 'string' && value.length > 0 ? value : 'info'
})

const message = computed(() => {
  const value = props.log?.data.message
  return typeof value === 'string' && value.length > 0 ? value : '—'
})

const type = computed(() => {
  const value = props.log?.data.type ?? props.log?.data.event
  return typeof value === 'string' && value.length > 0 ? value : '—'
})

const formattedJson = computed(() => JSON.stringify(props.log?.data ?? {}, null, 2))

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

function close(): void {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent data-log-dialog class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ t('campaigns.detail.logs.dialog.title') }}</DialogTitle>
        <DialogDescription>{{ t('campaigns.detail.logs.dialog.description') }}</DialogDescription>
      </DialogHeader>

      <div v-if="log" class="space-y-4">
        <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" :class="phaseClass(phase)">
            {{ phaseLabel(phase) }}
          </Badge>

          <Badge variant="outline" :class="levelClass(level)">
            {{ levelLabel(level) }}
          </Badge>

          <span data-log-dialog-date>{{ formatDateTime(log.created_at) }}</span>
        </div>

        <div class="space-y-1">
          <p data-log-dialog-message class="text-sm font-medium text-foreground">
            {{ message }}
          </p>
          <p data-log-dialog-type class="text-xs text-muted-foreground">
            {{ type }}
          </p>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {{ t('campaigns.detail.logs.dialog.context') }}
          </p>

          <ScrollArea class="max-h-96 rounded-lg border border-border/70 bg-muted/40">
            <pre data-log-dialog-json class="overflow-x-auto p-4 whitespace-pre-wrap text-xs leading-5 font-mono">{{ formattedJson }}</pre>
          </ScrollArea>
        </div>
      </div>

      <DialogFooter>
        <Button data-log-dialog-close variant="outline" @click="close">
          {{ t('campaigns.detail.logs.dialog.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
