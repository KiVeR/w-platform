<script setup lang="ts">
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Copy, Eye, MoreHorizontal, Trash2, Send } from 'lucide-vue-next'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import CampaignStatusBadge from '@/components/shared/CampaignStatusBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { formatNumber, formatDate } from '@/utils/format'
import type { CampaignRow, CampaignPagination } from '@/types/campaign'

const props = defineProps<{
  data: CampaignRow[]
  isLoading: boolean
  hasError: boolean
  sort: string
  pagination: CampaignPagination
}>()

const emit = defineEmits<{
  sort: [field: string]
  page: [page: number]
  delete: [id: number]
  view: [id: number]
  duplicate: [id: number]
  retry: []
}>()

const { t } = useI18n()

const columns = [
  { key: 'name', sortable: true },
  { key: 'type', sortable: false },
  { key: 'status', sortable: false },
  { key: 'volume', field: 'volume_estimated', sortable: true },
  { key: 'date', field: 'created_at', sortable: true },
  { key: 'actions', sortable: false },
] as const

function getSortIcon(field: string) {
  const currentField = props.sort.replace(/^-/, '')
  if (currentField !== field) return ArrowUpDown
  return props.sort.startsWith('-') ? ArrowDown : ArrowUp
}

function getDisplayDate(row: CampaignRow): string {
  const iso = row.sent_at ?? row.scheduled_at ?? row.created_at
  return formatDate(iso)
}

function handleRowClick(row: CampaignRow, event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('[data-actions]')) return
  emit('view', row.id)
}
</script>

<template>
  <div>
    <PageSkeleton v-if="isLoading" variant="table" />

    <EmptyState
      v-else-if="hasError"
      :icon="AlertTriangle"
      :title="t('campaigns.error.title')"
      :description="t('campaigns.error.description')"
      :action-label="t('campaigns.error.retry')"
      @action="emit('retry')"
    />

    <EmptyState
      v-else-if="data.length === 0"
      :icon="Send"
      :title="t('campaigns.empty.title')"
      :description="t('campaigns.empty.description')"
      :action-label="t('campaigns.empty.action')"
      action-to="/campaigns/new"
    />

    <div v-else>
      <div class="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                v-for="col in columns"
                :key="col.key"
                :class="col.key === 'actions' ? 'w-[60px]' : ''"
              >
                <button
                  v-if="col.sortable"
                  class="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors"
                  @click="emit('sort', (col as { field?: string }).field ?? col.key)"
                >
                  {{ t(`campaigns.columns.${col.key}`) }}
                  <component :is="getSortIcon((col as { field?: string }).field ?? col.key)" class="size-3.5" />
                </button>
                <span v-else class="text-xs font-medium">
                  {{ t(`campaigns.columns.${col.key}`) }}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow
              v-for="row in data"
              :key="row.id"
              class="cursor-pointer hover:bg-muted/50 transition-colors duration-150"
              @click="handleRowClick(row, $event)"
            >
              <TableCell class="font-medium max-w-[250px] truncate">
                {{ row.name }}
              </TableCell>
              <TableCell>
                {{ t(`campaigns.type.${row.type}`) }}
              </TableCell>
              <TableCell>
                <CampaignStatusBadge :status="row.status" />
              </TableCell>
              <TableCell>
                {{ row.volume_estimated != null ? formatNumber(row.volume_estimated) : '—' }}
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ getDisplayDate(row) }}
              </TableCell>
              <TableCell data-actions>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="size-8">
                      <MoreHorizontal class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="emit('view', row.id)">
                      <Eye class="mr-2 size-4" />
                      {{ t('campaigns.actions.view') }}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      v-if="row.status !== 'draft'"
                      data-duplicate-action
                      @click="emit('duplicate', row.id)"
                    >
                      <Copy class="mr-2 size-4" />
                      {{ t('campaigns.actions.duplicate') }}
                    </DropdownMenuItem>

                    <AlertDialog v-if="row.status === 'draft'">
                      <AlertDialogTrigger as-child>
                        <DropdownMenuItem
                          class="text-destructive focus:text-destructive"
                          @select.prevent
                        >
                          <Trash2 class="mr-2 size-4" />
                          {{ t('campaigns.actions.delete') }}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{{ t('campaigns.deleteConfirm.title') }}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {{ t('campaigns.deleteConfirm.description', { name: row.name }) }}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{{ t('campaigns.deleteConfirm.cancel') }}</AlertDialogCancel>
                          <AlertDialogAction
                            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            @click="emit('delete', row.id)"
                          >
                            {{ t('campaigns.deleteConfirm.confirm') }}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-2 py-4">
        <p class="text-sm text-muted-foreground">
          {{ t('campaigns.pagination.total', { total: pagination.total }) }}
        </p>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page <= 1"
            @click="emit('page', pagination.page - 1)"
          >
            {{ t('campaigns.pagination.previous') }}
          </Button>
          <span class="text-sm text-muted-foreground">
            {{ t('campaigns.pagination.page', { page: pagination.page, lastPage: pagination.lastPage }) }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page >= pagination.lastPage"
            @click="emit('page', pagination.page + 1)"
          >
            {{ t('campaigns.pagination.next') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
