import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, ref, onMounted, watch, defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser } from '../../helpers/fixtures'
import { mockUseI18n } from '../../helpers/stubs'
import { useAuthStore } from '@/stores/auth'
import type { UserRow, UserPagination, UserFilters } from '@/types/user'

stubAuthGlobals()
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRoute', () => ({ params: { id: '42' } }))
mockUseI18n()

const mockUsers = ref<UserRow[]>([
  {
    id: 1, firstname: 'Jean', lastname: 'Dupont', full_name: 'Jean Dupont',
    email: 'jean@test.com', partner_id: 42, partner_name: 'Partner Alpha',
    roles: ['partner'], is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
])
const mockPagination = ref<UserPagination>({ page: 1, lastPage: 1, total: 1 })
const mockIsLoading = ref(false)
const mockHasError = ref(false)
const mockSort = ref('-created_at')
const mockFetchUsers = vi.fn(async () => {})
const mockCreateUser = vi.fn(async () => ({ id: 3 }))
const mockUpdateUser = vi.fn(async () => ({ id: 1 }))
const mockDeleteUser = vi.fn(async () => true)
const mockSetPage = vi.fn(async () => {})
const mockSetSort = vi.fn(async () => {})
const mockSetFilters = vi.fn()

vi.stubGlobal('useUsers', () => ({
  users: mockUsers,
  pagination: mockPagination,
  isLoading: mockIsLoading,
  hasError: mockHasError,
  filters: ref<UserFilters>({}),
  sort: mockSort,
  perPage: ref(15),
  fetchUsers: mockFetchUsers,
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deleteUser: mockDeleteUser,
  setPage: mockSetPage,
  setSort: mockSetSort,
  setFilters: mockSetFilters,
}))

const PartnerUsersPage = (await import('@/pages/partners/[id]/users.vue')).default

const UserDataTableStub = defineComponent({
  name: 'UserDataTable',
  template: '<div data-user-table />',
  emits: ['sort', 'page', 'edit', 'delete', 'retry'],
})

const UserFormDialogStub = defineComponent({
  name: 'UserFormDialog',
  template: '<div data-user-form-dialog />',
  props: ['open', 'mode', 'isSaving', 'initialData'],
  emits: ['update:open', 'confirm'],
})

describe('partners/[id]/users.vue (scoped)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())

    const auth = useAuthStore()
    auth.user = { ...fakeAdminUser }
  })

  function mountPage() {
    return mount(PartnerUsersPage, {
      global: {
        stubs: {
          Button: { template: '<button v-bind="$attrs"><slot /></button>' },
          Input: { template: '<input v-bind="$attrs" />', props: ['modelValue', 'placeholder'] },
          UserDataTable: UserDataTableStub,
          UserFormDialog: UserFormDialogStub,
        },
      },
    })
  }

  it('calls setFilters with partner_id and fetchUsers on mount', async () => {
    mountPage()
    await flushPromises()

    expect(mockSetFilters).toHaveBeenCalledWith({ partner_id: 42 })
    expect(mockFetchUsers).toHaveBeenCalledTimes(1)
  })

  it('renders the page with data-partner-users-page attribute', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-partner-users-page]').exists()).toBe(true)
  })

  it('renders UserDataTable', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-user-table]').exists()).toBe(true)
  })

  it('renders new user button', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-new-user-btn]').exists()).toBe(true)
  })

  it('renders search input', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-search-input]').exists()).toBe(true)
  })
})
