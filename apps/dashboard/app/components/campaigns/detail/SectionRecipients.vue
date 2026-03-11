<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Info, MousePointerClick, Search, Users } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import CollapsibleSection from '@/components/campaigns/detail/CollapsibleSection.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useCampaignRecipients } from '@/composables/useCampaignRecipients'
import type { CampaignRecipientRow, CampaignRecipientStatus } from '@/types/campaign'
import { formatDateTime, formatNumber } from '@/utils/format'

type FilterKey = 'all' | 'delivered' | 'failed' | 'expired' | 'stop'

const props = defineProps<{
  campaignId: number
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

const {
  recipients,
  pagination,
  isLoading,
  hasError,
  filters,
  fetchRecipients,
  setPage,
  setPerPage,
  setFilters,
} = useCampaignRecipients(() => props.campaignId)

const activeFilter = ref<FilterKey>('all')
const searchQuery = ref(filters.value.search)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const filterOptions = computed(() => [
  { key: 'all' as const, label: t('campaigns.detail.recipients.filters.all'), statuses: [] },
  { key: 'delivered' as const, label: t('campaigns.detail.recipients.filters.delivered'), statuses: ['DELIVERED'] satisfies CampaignRecipientStatus[] },
  {
    key: 'failed' as const,
    label: t('campaigns.detail.recipients.filters.failed'),
    statuses: ['FAILED', 'REJECTED', 'UNDELIVERABLE'] satisfies CampaignRecipientStatus[],
  },
  { key: 'expired' as const, label: t('campaigns.detail.recipients.filters.expired'), statuses: ['EXPIRED'] satisfies CampaignRecipientStatus[] },
  { key: 'stop' as const, label: t('campaigns.detail.recipients.filters.stop'), statuses: ['CANCELED'] satisfies CampaignRecipientStatus[] },
])

const paginationSummary = computed(() => {
  const total = pagination.value.total
  if (total === 0) {
    return t('campaigns.detail.recipients.pagination.summary', { from: 0, to: 0, total: 0 })
  }

  const from = (pagination.value.page - 1) * pagination.value.perPage + 1
  const to = Math.min(pagination.value.page * pagination.value.perPage, total)

  return t('campaigns.detail.recipients.pagination.summary', { from, to, total: formatNumber(total) })
})

const emptyDescription = computed(() => {
  if (activeFilter.value === 'all') {
    return t('campaigns.detail.recipients.emptyDescription')
  }

  return t('campaigns.detail.recipients.emptyDescriptionFiltered', {
    status: filterOptions.value.find(option => option.key === activeFilter.value)?.label ?? '',
  })
})

function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length <= 6) return phoneNumber
  return `${phoneNumber.slice(0, 4)}••${phoneNumber.slice(-2)}`
}

function truncateMessage(message: string | null): string {
  if (!message) return '—'
  if (message.length <= 40) return message
  return `${message.slice(0, 40).trimEnd()}…`
}

function recipientStatusClass(status: CampaignRecipientStatus): string {
  switch (status) {
    case 'DELIVERED':
      return 'border-success-500/20 bg-success-50 text-success-700'
    case 'FAILED':
    case 'REJECTED':
    case 'UNDELIVERABLE':
      return 'border-destructive/20 bg-destructive/5 text-destructive'
    case 'EXPIRED':
      return 'border-warning-500/20 bg-warning-50 text-warning-700'
    case 'CANCELED':
      return 'border-amber-500/20 bg-amber-50 text-amber-700'
    default:
      return 'border-border bg-muted/40 text-muted-foreground'
  }
}

function recipientStatusLabel(status: CampaignRecipientStatus): string {
  return t(`campaigns.detail.recipients.status.${status}`)
}

function additionalInformationTitle(recipient: CampaignRecipientRow): string | null {
  if (!recipient.additional_information) return null
  return JSON.stringify(recipient.additional_information, null, 2)
}

async function applyFilter(key: FilterKey): Promise<void> {
  activeFilter.value = key
  const nextFilter = filterOptions.value.find(option => option.key === key)

  setFilters({ statuses: nextFilter?.statuses ?? [] })
  await fetchRecipients()
}

async function handlePerPageChange(value: string | number): Promise<void> {
  await setPerPage(Number(value))
}

watch(searchQuery, (value) => {
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    setFilters({ search: value })
    await fetchRecipients()
  }, 250)
})

onMounted(async () => {
  await fetchRecipients()
})

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<template>
  <CollapsibleSection
    :open="open"
    :title="t('campaigns.detail.recipients.title')"
    :badge="pagination.total"
    :icon="Users"
    :default-open="false"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="option in filterOptions"
            :key="option.key"
            :data-filter="option.key"
            size="sm"
            :variant="activeFilter === option.key ? 'default' : 'outline'"
            @click="applyFilter(option.key)"
          >
            {{ option.label }}
          </Button>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative min-w-0 sm:w-72">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              data-search-input
              :placeholder="t('campaigns.detail.recipients.searchPlaceholder')"
              class="pl-9"
            />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              {{ t('campaigns.detail.recipients.pagination.perPage') }}
            </span>
            <NativeSelect
              data-per-page
              class="w-22"
              :model-value="String(pagination.perPage)"
              @update:model-value="handlePerPageChange"
            >
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      <div v-if="hasError" data-recipients-error>
        <EmptyState
          :icon="Users"
          :title="t('campaigns.detail.recipients.errorTitle')"
          :description="t('campaigns.detail.recipients.errorDescription')"
          :action-label="t('campaigns.detail.recipients.retry')"
          @action="fetchRecipients"
        />
      </div>

      <div v-else-if="isLoading" data-recipients-loading class="space-y-3">
        <div
          v-for="index in 3"
          :key="index"
          class="h-18 rounded-xl border border-border/70 bg-muted/35"
        />
      </div>

      <EmptyState
        v-else-if="recipients.length === 0"
        data-empty-state
        :icon="Users"
        :title="t('campaigns.detail.recipients.emptyTitle')"
        :description="emptyDescription"
      />

      <template v-else>
        <div data-recipients-table class="hidden overflow-x-auto rounded-xl border border-border/70 md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t('campaigns.detail.recipients.columns.phone') }}</TableHead>
                <TableHead>{{ t('campaigns.detail.recipients.columns.status') }}</TableHead>
                <TableHead>{{ t('campaigns.detail.recipients.columns.message') }}</TableHead>
                <TableHead>{{ t('campaigns.detail.recipients.columns.clicks') }}</TableHead>
                <TableHead>{{ t('campaigns.detail.recipients.columns.deliveredAt') }}</TableHead>
                <TableHead class="w-[48px] text-right">{{ t('campaigns.detail.recipients.columns.info') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="recipient in recipients"
                :key="recipient.id"
              >
                <TableCell class="font-medium tabular-nums">
                  {{ maskPhoneNumber(recipient.phone_number) }}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    :class="recipientStatusClass(recipient.status)"
                  >
                    {{ recipientStatusLabel(recipient.status) }}
                  </Badge>
                </TableCell>
                <TableCell
                  :title="recipient.message_preview ?? undefined"
                  class="max-w-[320px] truncate"
                >
                  {{ truncateMessage(recipient.message_preview) }}
                </TableCell>
                <TableCell>
                  <div class="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <MousePointerClick class="size-4" />
                    <span>{{ formatNumber(recipient.short_url_click) }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {{ recipient.delivered_at ? formatDateTime(recipient.delivered_at) : '—' }}
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    v-if="recipient.additional_information"
                    :title="additionalInformationTitle(recipient) ?? undefined"
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Info class="size-4" />
                  </Button>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div data-recipients-mobile class="space-y-3 md:hidden">
          <div
            v-for="recipient in recipients"
            :key="recipient.id"
            class="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium tabular-nums">
                  {{ maskPhoneNumber(recipient.phone_number) }}
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ truncateMessage(recipient.message_preview) }}
                </p>
              </div>

              <Badge
                variant="outline"
                :class="recipientStatusClass(recipient.status)"
              >
                {{ recipientStatusLabel(recipient.status) }}
              </Badge>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {{ t('campaigns.detail.recipients.columns.clicks') }}
                </p>
                <p class="mt-1 font-medium">{{ formatNumber(recipient.short_url_click) }}</p>
              </div>

              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {{ t('campaigns.detail.recipients.columns.deliveredAt') }}
                </p>
                <p class="mt-1 font-medium">
                  {{ recipient.delivered_at ? formatDateTime(recipient.delivered_at) : '—' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p data-pagination-summary class="text-sm text-muted-foreground">
            {{ paginationSummary }}
          </p>

          <div class="flex items-center gap-2">
            <Button
              data-pagination-previous
              variant="outline"
              size="sm"
              :disabled="pagination.page <= 1"
              @click="setPage(pagination.page - 1)"
            >
              {{ t('campaigns.detail.recipients.pagination.previous') }}
            </Button>

            <Button
              data-pagination-next
              variant="outline"
              size="sm"
              :disabled="pagination.page >= pagination.lastPage"
              @click="setPage(pagination.page + 1)"
            >
              {{ t('campaigns.detail.recipients.pagination.next') }}
            </Button>
          </div>
        </div>
      </template>
    </div>
  </CollapsibleSection>
</template>
