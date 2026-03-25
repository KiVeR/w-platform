<script setup lang="ts">
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Building2, LogIn, Pencil, MoreHorizontal } from 'lucide-vue-next'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import PartnerStatusBadge from '@/components/hub/PartnerStatusBadge.vue'
import PartnerCreditsCell from '@/components/hub/PartnerCreditsCell.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import type { PartnerRow, PartnerPagination } from '@/types/partner'

const props = defineProps<{
  data: PartnerRow[]
  isLoading: boolean
  hasError: boolean
  sort: string
  pagination: PartnerPagination
}>()

const emit = defineEmits<{
  sort: [field: string]
  page: [page: number]
  enter: [partner: PartnerRow]
  edit: [id: number]
  retry: []
}>()

const { t } = useI18n()

const columns = [
  { key: 'name', sortable: true },
  { key: 'activity', field: 'activity_type', sortable: true },
  { key: 'credits', field: 'euro_credits', sortable: true },
  { key: 'shops', field: 'shops_count', sortable: false },
  { key: 'status', field: 'is_active', sortable: false },
  { key: 'actions', sortable: false },
] as const

function getSortIcon(field: string) {
  const currentField = props.sort.replace(/^-/, '')
  if (currentField !== field) return ArrowUpDown
  return props.sort.startsWith('-') ? ArrowDown : ArrowUp
}
</script>

<template>
  <div data-partner-data-table>
    <PageSkeleton v-if="isLoading" variant="table" />

    <EmptyState
      v-else-if="hasError"
      data-partner-table-error
      :icon="AlertTriangle"
      :title="t('hub.partners.error.title')"
      :description="t('hub.partners.error.description')"
      :action-label="t('hub.partners.error.retry')"
      @action="emit('retry')"
    />

    <EmptyState
      v-else-if="data.length === 0"
      data-partner-table-empty
      :icon="Building2"
      :title="t('hub.partners.empty.title')"
      :description="t('hub.partners.empty.description')"
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
                  {{ t(`hub.partners.columns.${col.key}`) }}
                  <component :is="getSortIcon((col as { field?: string }).field ?? col.key)" class="size-3.5" />
                </button>
                <span v-else class="text-xs font-medium">
                  {{ t(`hub.partners.columns.${col.key}`) }}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow
              v-for="row in data"
              :key="row.id"
              data-partner-row
              class="cursor-pointer hover:bg-muted/50 transition-colors duration-150"
              @click="emit('enter', row)"
            >
              <TableCell class="font-medium max-w-[250px] truncate">
                {{ row.name }}
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ row.activity_type ?? '—' }}
              </TableCell>
              <TableCell>
                <PartnerCreditsCell :credits="row.euro_credits" />
              </TableCell>
              <TableCell>
                {{ row.shops_count }}
              </TableCell>
              <TableCell>
                <PartnerStatusBadge :is-active="row.is_active" />
              </TableCell>
              <TableCell data-actions @click.stop>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="size-8">
                      <MoreHorizontal class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      data-enter-action
                      @click="emit('enter', row)"
                    >
                      <LogIn class="mr-2 size-4" />
                      {{ t('hub.partners.actions.enter') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-edit-action
                      @click="emit('edit', row.id)"
                    >
                      <Pencil class="mr-2 size-4" />
                      {{ t('hub.partners.actions.edit') }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.lastPage > 1"
        class="flex items-center justify-between px-2 py-4"
      >
        <p class="text-sm text-muted-foreground">
          {{ t('hub.partners.pagination.total', { total: pagination.total }) }}
        </p>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page <= 1"
            data-prev-page
            @click="emit('page', pagination.page - 1)"
          >
            {{ t('hub.partners.pagination.previous') }}
          </Button>
          <span class="text-sm text-muted-foreground">
            {{ t('hub.partners.pagination.page', { page: pagination.page, lastPage: pagination.lastPage }) }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page >= pagination.lastPage"
            data-next-page
            @click="emit('page', pagination.page + 1)"
          >
            {{ t('hub.partners.pagination.next') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
