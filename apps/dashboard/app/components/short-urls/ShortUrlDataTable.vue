<script setup lang="ts">
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Trash2, Link } from 'lucide-vue-next'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import EmptyState from '@/components/shared/EmptyState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { formatNumber } from '@/utils/format'
import type { ShortUrlRow, ShortUrlPagination } from '@/types/shortUrl'

const props = defineProps<{
  data: ShortUrlRow[]
  isLoading: boolean
  hasError: boolean
  sort: string
  pagination: ShortUrlPagination
}>()

const emit = defineEmits<{
  sort: [field: string]
  page: [page: number]
  delete: [id: number]
  view: [id: number]
  edit: [id: number]
  retry: []
}>()

const { t } = useI18n()

const columns = [
  { key: 'slug', label: 'slug', sortable: true },
  { key: 'link', label: 'link', sortable: true },
  { key: 'clickCount', label: 'clicks', sortable: true },
  { key: 'isEnabled', label: 'status', field: 'is_enabled', sortable: false },
  { key: 'actions', label: '', sortable: false },
] as const

function getSortIcon(field: string) {
  const currentField = props.sort.replace(/^-/, '')
  if (currentField !== field) return ArrowUpDown
  return props.sort.startsWith('-') ? ArrowDown : ArrowUp
}

function truncateLink(link: string | null): string {
  if (!link) return t('shortUrls.detail.internalLink')
  return link.length > 50 ? link.slice(0, 50) + '...' : link
}

function handleRowClick(row: ShortUrlRow, event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('[data-actions]')) return
  emit('view', row.id)
}
</script>

<template>
  <div>
    <PageSkeleton v-if="isLoading" variant="table" />
    <EmptyState v-else-if="hasError" :icon="AlertTriangle" :title="t('shortUrls.error.title')" :description="t('shortUrls.error.description')" :action-label="t('shortUrls.error.retry')" @action="emit('retry')" />
    <EmptyState v-else-if="data.length === 0" :icon="Link" :title="t('shortUrls.empty.title')" :description="t('shortUrls.empty.description')" />
    <div v-else>
      <div class="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead v-for="col in columns" :key="col.key" :class="col.key === 'actions' ? 'w-[60px]' : ''">
                <button v-if="col.sortable" class="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors" @click="emit('sort', (col as { field?: string }).field ?? col.key)">
                  {{ t(`shortUrls.columns.${col.label}`) }}
                  <component :is="getSortIcon((col as { field?: string }).field ?? col.key)" class="size-3.5" />
                </button>
                <span v-else-if="col.label" class="text-xs font-medium">{{ t(`shortUrls.columns.${col.label}`) }}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in data" :key="row.id" class="cursor-pointer hover:bg-muted/50 transition-colors duration-150" @click="handleRowClick(row, $event)">
              <TableCell class="font-medium">{{ row.slug }}</TableCell>
              <TableCell class="max-w-[300px] truncate text-muted-foreground">
                <span v-if="row.link">{{ truncateLink(row.link) }}</span>
                <Badge v-else variant="secondary">{{ t('shortUrls.detail.internalLink') }}</Badge>
              </TableCell>
              <TableCell>{{ formatNumber(row.clickCount) }}</TableCell>
              <TableCell>
                <Badge :variant="row.isEnabled ? 'default' : 'destructive'">
                  {{ row.isEnabled ? t('shortUrls.status.active') : t('shortUrls.status.disabled') }}
                </Badge>
              </TableCell>
              <TableCell data-actions>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="size-8">
                      <Eye class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="emit('view', row.id)">
                      <Eye class="mr-2 size-4" />{{ t('shortUrls.actions.view') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="emit('edit', row.id)">
                      <Pencil class="mr-2 size-4" />{{ t('shortUrls.actions.edit') }}
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger as-child>
                        <DropdownMenuItem class="text-destructive focus:text-destructive" @select.prevent>
                          <Trash2 class="mr-2 size-4" />{{ t('shortUrls.actions.delete') }}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{{ t('shortUrls.form.deleteConfirm.title') }}</AlertDialogTitle>
                          <AlertDialogDescription>{{ t('shortUrls.form.deleteConfirm.description') }}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                          <AlertDialogAction @click="emit('delete', row.id)">{{ t('common.confirm') }}</AlertDialogAction>
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
        <p class="text-sm text-muted-foreground">{{ t('shortUrls.pagination.total', { total: pagination.total }) }}</p>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="pagination.page <= 1" @click="emit('page', pagination.page - 1)">{{ t('shortUrls.pagination.previous') }}</Button>
          <span class="text-sm text-muted-foreground">{{ t('shortUrls.pagination.page', { page: pagination.page, lastPage: pagination.lastPage }) }}</span>
          <Button variant="outline" size="sm" :disabled="pagination.page >= pagination.lastPage" @click="emit('page', pagination.page + 1)">{{ t('shortUrls.pagination.next') }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>
