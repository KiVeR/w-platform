<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, PencilLine, Plus, Router, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import RouterFormDialog from '@/components/admin/RouterFormDialog.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Router as AdminRouter, RouterForm } from '@/types/admin'
import { formatDate, formatNumber } from '@/utils/format'

const { t } = useI18n()
const {
  routers,
  isLoading,
  isSaving,
  hasError,
  deleteError,
  fetchRouters,
  createRouter,
  updateRouter,
  deleteRouter,
  clearDeleteError,
} = useRouters()

const editingRouter = ref<AdminRouter | null>(null)
const deleteTarget = ref<AdminRouter | null>(null)
const isFormOpen = ref(false)

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
  breadcrumbLabel: 'Routeurs',
})

onMounted(async () => {
  await fetchRouters()
})

function openCreateDialog(): void {
  editingRouter.value = null
  isFormOpen.value = true
  clearDeleteError()
}

function openEditDialog(router: AdminRouter): void {
  editingRouter.value = router
  isFormOpen.value = true
  clearDeleteError()
}

function handleDialogOpenChange(value: boolean): void {
  isFormOpen.value = value
  if (!value) {
    editingRouter.value = null
  }
}

async function handleSubmit(form: RouterForm): Promise<void> {
  const success = editingRouter.value
    ? await updateRouter(editingRouter.value.id, form)
    : await createRouter(form)

  if (!success) {
    return
  }

  toast.success(
    editingRouter.value
      ? t('admin.routers.messages.updated')
      : t('admin.routers.messages.created'),
  )

  editingRouter.value = null
  isFormOpen.value = false
  await fetchRouters()
}

async function handleDeleteConfirm(): Promise<void> {
  if (!deleteTarget.value) return

  const deleted = await deleteRouter(deleteTarget.value.id)
  if (!deleted) {
    return
  }

  toast.success(t('admin.routers.messages.deleted'))
  deleteTarget.value = null
}
</script>

<template>
  <div data-admin-page="routers" class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="max-w-3xl space-y-2">
        <h1 class="text-2xl font-bold text-foreground">
          {{ t('admin.routers.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('admin.routers.description') }}
        </p>
      </div>

      <Button data-router-create @click="openCreateDialog">
        <Plus class="mr-2 size-4" />
        {{ t('admin.routers.create') }}
      </Button>
    </div>

    <Alert v-if="deleteError === 'in_use'" data-router-delete-alert variant="destructive">
      <AlertTriangle class="size-4" />
      <AlertTitle>{{ t('admin.routers.alerts.deleteInUseTitle') }}</AlertTitle>
      <AlertDescription>
        {{ t('admin.routers.alerts.deleteInUseDescription') }}
      </AlertDescription>
    </Alert>

    <PageSkeleton v-if="isLoading" variant="table" />

    <EmptyState
      v-else-if="hasError"
      :icon="Router"
      :title="t('admin.routers.error.title')"
      :description="t('admin.routers.error.description')"
      :action-label="t('admin.routers.error.retry')"
      @action="fetchRouters"
    />

    <EmptyState
      v-else-if="routers.length === 0"
      :icon="Router"
      :title="t('admin.routers.empty.title')"
      :description="t('admin.routers.empty.description')"
      :action-label="t('admin.routers.empty.action')"
      @action="openCreateDialog"
    />

    <div v-else class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('admin.routers.table.name') }}</TableHead>
            <TableHead>{{ t('admin.routers.table.externalId') }}</TableHead>
            <TableHead>{{ t('admin.routers.table.numStop') }}</TableHead>
            <TableHead>{{ t('admin.routers.table.partners') }}</TableHead>
            <TableHead>{{ t('admin.routers.table.campaigns') }}</TableHead>
            <TableHead>{{ t('admin.routers.table.status') }}</TableHead>
            <TableHead>{{ t('admin.routers.table.createdAt') }}</TableHead>
            <TableHead class="w-[120px] text-right">{{ t('admin.routers.table.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="router in routers" :key="router.id" data-router-row>
            <TableCell class="font-medium">
              {{ router.name }}
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ router.external_id ?? '—' }}
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ router.num_stop ?? '—' }}
            </TableCell>
            <TableCell>{{ formatNumber(router.partners_count) }}</TableCell>
            <TableCell>{{ formatNumber(router.campaigns_count) }}</TableCell>
            <TableCell>
              <Badge :variant="router.is_active ? 'secondary' : 'outline'">
                {{ router.is_active
                  ? t('admin.routers.status.active')
                  : t('admin.routers.status.inactive') }}
              </Badge>
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ router.created_at ? formatDate(router.created_at) : '—' }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-router-edit
                  @click="openEditDialog(router)"
                >
                  <PencilLine class="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-router-delete
                  @click="deleteTarget = router"
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <RouterFormDialog
      :open="isFormOpen"
      :router="editingRouter"
      :is-loading="isSaving"
      @update:open="handleDialogOpenChange"
      @submit="handleSubmit"
    />

    <AlertDialog v-model:open="isDeleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('admin.routers.deleteConfirm.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('admin.routers.deleteConfirm.description', { name: deleteTarget?.name ?? '—' }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('admin.routers.deleteConfirm.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
            data-router-delete-confirm
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isSaving"
            @click="handleDeleteConfirm"
          >
            {{ t('admin.routers.deleteConfirm.confirm') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
