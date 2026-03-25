<script setup lang="ts">
import UserDataTable from '@/components/admin/UserDataTable.vue'
import UserFormDialog from '@/components/admin/UserFormDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { AcceptableValue } from 'reka-ui'
import type { UserRow, UserFormData } from '@/types/user'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['manage partners'],
})

const { t } = useI18n()

const {
  users,
  pagination,
  isLoading,
  hasError,
  sort,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  setPage,
  setSort,
  setFilters,
} = useUsers()

const searchQuery = ref('')
const roleFilter = ref<string>('all')
const statusFilter = ref<string>('all')

const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingUser = ref<UserRow | null>(null)
const isSaving = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput(val: string | number) {
  const value = String(val)
  searchQuery.value = value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    setFilters({ search: value || undefined })
    fetchUsers()
  }, 300)
}

function onRoleChange(val: AcceptableValue) {
  const value = String(val)
  roleFilter.value = value
  setFilters({ role: value === 'all' ? null : value })
  fetchUsers()
}

function onStatusChange(val: AcceptableValue) {
  const value = String(val)
  statusFilter.value = value
  if (value === 'all') {
    setFilters({ is_active: null })
  }
  else {
    setFilters({ is_active: value === 'active' })
  }
  fetchUsers()
}

function handleSort(field: string) {
  setSort(field)
}

function handlePage(page: number) {
  setPage(page)
}

function handleRetry() {
  fetchUsers()
}

function handleNewUser() {
  formMode.value = 'create'
  editingUser.value = null
  showFormDialog.value = true
}

function handleEditUser(user: UserRow) {
  formMode.value = 'edit'
  editingUser.value = user
  showFormDialog.value = true
}

async function handleDeleteUser(user: UserRow) {
  const success = await deleteUser(user.id)
  if (success) {
    await fetchUsers()
  }
}

async function handleFormConfirm(data: UserFormData) {
  isSaving.value = true
  try {
    if (formMode.value === 'create') {
      const result = await createUser(data)
      if (result) {
        showFormDialog.value = false
        await fetchUsers()
      }
    }
    else if (editingUser.value) {
      const result = await updateUser(editingUser.value.id, data)
      if (result) {
        showFormDialog.value = false
        await fetchUsers()
      }
    }
  }
  finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div
    data-admin-users-page
    class="space-y-6"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ t('admin.users.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('admin.users.description') }}
        </p>
      </div>
      <Button data-new-user-btn @click="handleNewUser">
        {{ t('admin.users.newUser') }}
      </Button>
    </div>

    <!-- Filters bar -->
    <div class="flex items-center gap-4">
      <Input
        data-search-input
        :model-value="searchQuery"
        :placeholder="t('admin.users.searchPlaceholder')"
        class="max-w-sm"
        @update:model-value="onSearchInput"
      />
      <Select
        :model-value="roleFilter"
        @update:model-value="onRoleChange"
      >
        <SelectTrigger data-role-filter class="w-[180px]">
          <SelectValue :placeholder="t('admin.users.roleFilter.all')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {{ t('admin.users.roleFilter.all') }}
          </SelectItem>
          <SelectItem value="admin">admin</SelectItem>
          <SelectItem value="adv">adv</SelectItem>
          <SelectItem value="partner">partner</SelectItem>
          <SelectItem value="merchant">merchant</SelectItem>
          <SelectItem value="employee">employee</SelectItem>
        </SelectContent>
      </Select>
      <Select
        :model-value="statusFilter"
        @update:model-value="onStatusChange"
      >
        <SelectTrigger data-status-filter class="w-[180px]">
          <SelectValue :placeholder="t('admin.users.statusFilter.all')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {{ t('admin.users.statusFilter.all') }}
          </SelectItem>
          <SelectItem value="active">
            {{ t('admin.users.statusFilter.active') }}
          </SelectItem>
          <SelectItem value="inactive">
            {{ t('admin.users.statusFilter.inactive') }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- DataTable -->
    <UserDataTable
      :data="users"
      :is-loading="isLoading"
      :has-error="hasError"
      :sort="sort"
      :pagination="pagination"
      @sort="handleSort"
      @page="handlePage"
      @edit="handleEditUser"
      @delete="handleDeleteUser"
      @retry="handleRetry"
    />

    <!-- Form Dialog -->
    <UserFormDialog
      v-model:open="showFormDialog"
      :mode="formMode"
      :is-saving="isSaving"
      :initial-data="editingUser ? {
        firstname: editingUser.firstname,
        lastname: editingUser.lastname,
        email: editingUser.email,
        partner_id: editingUser.partner_id,
        role: editingUser.roles[0],
        is_active: editingUser.is_active,
      } : undefined"
      @confirm="handleFormConfirm"
    />
  </div>
</template>
