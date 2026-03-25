<script setup lang="ts">
import UserDataTable from '@/components/admin/UserDataTable.vue'
import UserFormDialog from '@/components/admin/UserFormDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserRow, UserFormData } from '@/types/user'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view partners'],
})

const { t } = useI18n()
const route = useRoute()

const partnerId = computed(() => Number(route.params.id))

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
    const payload = { ...data, partner_id: partnerId.value }
    if (formMode.value === 'create') {
      const result = await createUser(payload)
      if (result) {
        showFormDialog.value = false
        await fetchUsers()
      }
    }
    else if (editingUser.value) {
      const result = await updateUser(editingUser.value.id, payload)
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
  setFilters({ partner_id: partnerId.value })
  fetchUsers()
})
</script>

<template>
  <div
    data-partner-users-page
    class="space-y-6"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ t('admin.users.title') }}
        </h1>
      </div>
      <Button data-new-user-btn @click="handleNewUser">
        {{ t('admin.users.newUser') }}
      </Button>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-4">
      <Input
        data-search-input
        :model-value="searchQuery"
        :placeholder="t('admin.users.searchPlaceholder')"
        class="max-w-sm"
        @update:model-value="onSearchInput"
      />
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
        partner_id: partnerId,
        role: editingUser.roles[0],
        is_active: editingUser.is_active,
      } : { partner_id: partnerId }"
      @confirm="handleFormConfirm"
    />
  </div>
</template>
