<script setup lang="ts">
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Users, Pencil, Trash2, MoreHorizontal } from 'lucide-vue-next'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserRoleBadge from '@/components/admin/UserRoleBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import type { UserRow, UserPagination } from '@/types/user'

const props = defineProps<{
  data: UserRow[]
  isLoading: boolean
  hasError: boolean
  sort: string
  pagination: UserPagination
}>()

const emit = defineEmits<{
  sort: [field: string]
  page: [page: number]
  edit: [user: UserRow]
  delete: [user: UserRow]
  retry: []
}>()

const { t } = useI18n()

const columns = [
  { key: 'name', field: 'firstname', sortable: true },
  { key: 'email', field: 'email', sortable: true },
  { key: 'partner', sortable: false },
  { key: 'roles', sortable: false },
  { key: 'status', sortable: false },
  { key: 'actions', sortable: false },
] as const

function getSortIcon(field: string) {
  const currentField = props.sort.replace(/^-/, '')
  if (currentField !== field) return ArrowUpDown
  return props.sort.startsWith('-') ? ArrowDown : ArrowUp
}
</script>

<template>
  <div data-user-data-table>
    <PageSkeleton v-if="isLoading" variant="table" />

    <EmptyState
      v-else-if="hasError"
      data-user-table-error
      :icon="AlertTriangle"
      :title="t('admin.users.error.title')"
      :description="t('admin.users.error.description')"
      :action-label="t('admin.users.error.retry')"
      @action="emit('retry')"
    />

    <EmptyState
      v-else-if="data.length === 0"
      data-user-table-empty
      :icon="Users"
      :title="t('admin.users.empty.title')"
      :description="t('admin.users.empty.description')"
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
                  {{ t(`admin.users.columns.${col.key}`) }}
                  <component :is="getSortIcon((col as { field?: string }).field ?? col.key)" class="size-3.5" />
                </button>
                <span v-else class="text-xs font-medium">
                  {{ t(`admin.users.columns.${col.key}`) }}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow
              v-for="row in data"
              :key="row.id"
              data-user-row
            >
              <TableCell class="font-medium max-w-[200px] truncate">
                {{ row.full_name }}
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ row.email }}
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ row.partner_name ?? '—' }}
              </TableCell>
              <TableCell>
                <div class="flex gap-1 flex-wrap">
                  <UserRoleBadge
                    v-for="role in row.roles"
                    :key="role"
                    :role="role"
                  />
                </div>
              </TableCell>
              <TableCell>
                <span
                  data-user-status
                  :class="[
                    row.is_active
                      ? 'bg-success-100 text-success-700 border-success-500/30'
                      : 'bg-error-100 text-error-700 border-error-500/30',
                    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                  ]"
                >
                  {{ row.is_active ? t('admin.users.status.active') : t('admin.users.status.inactive') }}
                </span>
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
                      data-edit-action
                      @click="emit('edit', row)"
                    >
                      <Pencil class="mr-2 size-4" />
                      {{ t('admin.users.actions.edit') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-delete-action
                      class="text-destructive"
                      @click="emit('delete', row)"
                    >
                      <Trash2 class="mr-2 size-4" />
                      {{ t('admin.users.actions.delete') }}
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
          {{ t('admin.users.pagination.total', { total: pagination.total }) }}
        </p>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page <= 1"
            data-prev-page
            @click="emit('page', pagination.page - 1)"
          >
            {{ t('admin.users.pagination.previous') }}
          </Button>
          <span class="text-sm text-muted-foreground">
            {{ t('admin.users.pagination.page', { page: pagination.page, lastPage: pagination.lastPage }) }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page >= pagination.lastPage"
            data-next-page
            @click="emit('page', pagination.page + 1)"
          >
            {{ t('admin.users.pagination.next') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
