<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Copy, FileCode, MoreHorizontal, PencilLine, Plus, Trash2 } from 'lucide-vue-next'
import EmptyState from '@/components/shared/EmptyState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import VariableCloneDialog from '@/components/admin/variable-schemas/VariableCloneDialog.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { VariableSchema } from '@/types/admin'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const {
  schemas,
  isLoading,
  isSaving,
  hasError,
  fetchSchemas,
  deleteSchema,
  cloneSchema,
} = useVariableSchemas()

const cloneTarget = ref<VariableSchema | null>(null)
const deleteTarget = ref<VariableSchema | null>(null)

const isDeleteOpen = computed({
  get: () => deleteTarget.value !== null,
  set: (value: boolean) => {
    if (!value) {
      deleteTarget.value = null
    }
  },
})

definePageMeta({
  middleware: 'admin',
})

onMounted(async () => {
  await fetchSchemas()
})

function globalCount(schema: VariableSchema): number {
  return schema.fields.filter(field => field.is_global).length
}

function recipientCount(schema: VariableSchema): number {
  return schema.fields.filter(field => !field.is_global).length
}

function shortUuid(uuid: string): string {
  return uuid.slice(0, 8)
}

function handleCloneOpenChange(value: boolean): void {
  if (!value) {
    cloneTarget.value = null
  }
}

async function handleCloneConfirm(): Promise<void> {
  if (!cloneTarget.value) return

  const cloned = await cloneSchema(cloneTarget.value.uuid)
  if (!cloned) return

  cloneTarget.value = null
  await fetchSchemas()
  await navigateTo(`/admin/variable-schemas/${cloned.uuid}`)
}

async function handleDeleteConfirm(): Promise<void> {
  if (!deleteTarget.value) return

  const deleted = await deleteSchema(deleteTarget.value.uuid)
  if (!deleted) return

  deleteTarget.value = null
}
</script>

<template>
  <div data-admin-page="variable-schemas" class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="max-w-3xl space-y-2">
        <h1 class="text-2xl font-bold text-foreground">
          {{ t('admin.variableSchemas.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('admin.variableSchemas.description') }}
        </p>
      </div>

      <Button as-child>
        <NuxtLink to="/admin/variable-schemas/new" data-schema-create>
          <Plus class="mr-2 size-4" />
          {{ t('admin.variableSchemas.create') }}
        </NuxtLink>
      </Button>
    </div>

    <PageSkeleton v-if="isLoading" variant="table" />

    <EmptyState
      v-else-if="hasError"
      :icon="FileCode"
      :title="t('admin.variableSchemas.error.title')"
      :description="t('admin.variableSchemas.error.description')"
      :action-label="t('admin.variableSchemas.error.retry')"
      @action="fetchSchemas"
    />

    <EmptyState
      v-else-if="schemas.length === 0"
      :icon="FileCode"
      :title="t('admin.variableSchemas.empty.title')"
      :description="t('admin.variableSchemas.empty.description')"
      :action-label="t('admin.variableSchemas.empty.action')"
      action-to="/admin/variable-schemas/new"
    />

    <div v-else class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('admin.variableSchemas.table.name') }}</TableHead>
            <TableHead>{{ t('admin.variableSchemas.table.partner') }}</TableHead>
            <TableHead>{{ t('admin.variableSchemas.table.variables') }}</TableHead>
            <TableHead>{{ t('admin.variableSchemas.table.uuid') }}</TableHead>
            <TableHead>{{ t('admin.variableSchemas.table.createdAt') }}</TableHead>
            <TableHead class="w-[60px] text-right">{{ t('admin.variableSchemas.table.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="schema in schemas" :key="schema.uuid" data-schema-row>
            <TableCell class="font-medium">
              {{ schema.name }}
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ schema.partner?.name ?? '—' }}
            </TableCell>
            <TableCell>
              <div class="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {{ t('admin.variableSchemas.badges.global', { count: globalCount(schema) }) }}
                </Badge>
                <Badge variant="outline">
                  {{ t('admin.variableSchemas.badges.recipient', { count: recipientCount(schema) }) }}
                </Badge>
              </div>
            </TableCell>
            <TableCell class="font-mono text-xs text-muted-foreground">
              {{ shortUuid(schema.uuid) }}
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ schema.created_at ? formatDate(schema.created_at) : '—' }}
            </TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8">
                    <MoreHorizontal class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem as-child>
                    <NuxtLink
                      :to="`/admin/variable-schemas/${schema.uuid}`"
                      data-schema-edit-link
                    >
                      <PencilLine class="mr-2 size-4" />
                      {{ t('admin.variableSchemas.actions.edit') }}
                    </NuxtLink>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    data-clone-action
                    @click="cloneTarget = schema"
                  >
                    <Copy class="mr-2 size-4" />
                    {{ t('admin.variableSchemas.actions.clone') }}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    data-delete-action
                    class="text-destructive focus:text-destructive"
                    @click="deleteTarget = schema"
                  >
                    <Trash2 class="mr-2 size-4" />
                    {{ t('admin.variableSchemas.actions.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <VariableCloneDialog
      :open="cloneTarget !== null"
      :schema="cloneTarget"
      :is-loading="isSaving"
      @update:open="handleCloneOpenChange"
      @confirm="handleCloneConfirm"
    />

    <AlertDialog v-model:open="isDeleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('admin.variableSchemas.deleteConfirm.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('admin.variableSchemas.deleteConfirm.description', { name: deleteTarget?.name ?? '—' }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('admin.variableSchemas.deleteConfirm.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
            data-schema-delete-confirm
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSaving"
            @click="handleDeleteConfirm"
          >
            {{ t('admin.variableSchemas.deleteConfirm.confirm') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
