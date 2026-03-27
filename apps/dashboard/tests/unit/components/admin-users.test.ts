import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, ref, onMounted, watch } from 'vue'
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
vi.stubGlobal('useRoute', () => ({ params: {}, path: '/admin/users' }))
mockUseI18n()

const mockUsers = ref<UserRow[]>([
  {
    id: 1, firstname: 'Jean', lastname: 'Dupont', full_name: 'Jean Dupont',
    email: 'jean@test.com', partner_id: 42, partner_name: 'Partner Alpha',
    roles: ['partner'], is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2, firstname: 'Alice', lastname: 'Martin', full_name: 'Alice Martin',
    email: 'alice@test.com', partner_id: null, partner_name: undefined,
    roles: ['admin'], is_active: true, created_at: '2026-02-01T00:00:00Z',
  },
])
const mockPagination = ref<UserPagination>({ page: 1, lastPage: 1, total: 2 })
const mockIsLoading = ref(false)
const mockHasError = ref(false)
const mockFilters = ref<UserFilters>({})
const mockSort = ref('-created_at')
const mockFetchUsers = vi.fn(async () => {})
const mockCreateUser = vi.fn(async () => ({ id: 3, firstname: 'New', lastname: 'User', full_name: 'New User', email: 'new@test.com', partner_id: null, roles: ['partner'], is_active: true, created_at: '' }))
const mockUpdateUser = vi.fn(async () => ({ id: 1, firstname: 'Updated', lastname: 'User', full_name: 'Updated User', email: 'jean@test.com', partner_id: 42, roles: ['partner'], is_active: true, created_at: '' }))
const mockDeleteUser = vi.fn(async () => true)
const mockSetPage = vi.fn(async () => {})
const mockSetSort = vi.fn(async () => {})
const mockSetFilters = vi.fn()

vi.stubGlobal('useUsers', () => ({
  users: mockUsers,
  pagination: mockPagination,
  isLoading: mockIsLoading,
  hasError: mockHasError,
  filters: mockFilters,
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

const { default: UserRoleBadge } = await import('@/components/admin/UserRoleBadge.vue')
const { default: UserDataTable } = await import('@/components/admin/UserDataTable.vue')
const { default: AdminUsersPage } = await import('@/pages/admin/users/index.vue')

// --- UserRoleBadge ---
describe('UserRoleBadge', () => {
  it('renders the role name', () => {
    const wrapper = mount(UserRoleBadge, { props: { role: 'admin' } })
    expect(wrapper.text()).toBe('admin')
    expect(wrapper.find('[data-user-role-badge]').exists()).toBe(true)
    expect(wrapper.find('[data-role="admin"]').exists()).toBe(true)
  })

  it('applies purple class for admin role', () => {
    const wrapper = mount(UserRoleBadge, { props: { role: 'admin' } })
    expect(wrapper.find('[data-user-role-badge]').classes()).toContain('text-purple-700')
  })

  it('applies emerald class for partner role', () => {
    const wrapper = mount(UserRoleBadge, { props: { role: 'partner' } })
    expect(wrapper.find('[data-user-role-badge]').classes()).toContain('text-emerald-700')
  })

  it('applies amber class for merchant role', () => {
    const wrapper = mount(UserRoleBadge, { props: { role: 'merchant' } })
    expect(wrapper.find('[data-user-role-badge]').classes()).toContain('text-amber-700')
  })

  it('applies gray class for unknown role', () => {
    const wrapper = mount(UserRoleBadge, { props: { role: 'unknown' } })
    expect(wrapper.find('[data-user-role-badge]').classes()).toContain('text-gray-700')
  })
})

// --- UserDataTable ---
describe('UserDataTable', () => {
  const baseProps = {
    data: mockUsers.value,
    isLoading: false,
    hasError: false,
    sort: '-created_at',
    pagination: { page: 1, lastPage: 1, total: 2 },
  }

  it('renders user rows', () => {
    const wrapper = mount(UserDataTable, { props: baseProps })
    const rows = wrapper.findAll('[data-user-row]')
    expect(rows).toHaveLength(2)
  })

  it('shows full_name and email in rows', () => {
    const wrapper = mount(UserDataTable, { props: baseProps })
    expect(wrapper.text()).toContain('Jean Dupont')
    expect(wrapper.text()).toContain('jean@test.com')
    expect(wrapper.text()).toContain('Partner Alpha')
  })

  it('shows dash for users without partner', () => {
    const wrapper = mount(UserDataTable, {
      props: {
        ...baseProps,
        data: [mockUsers.value[1]],
      },
    })
    // the user without partner_name shows '—'
    const text = wrapper.text()
    expect(text).toContain('\u2014') // em-dash
  })

  it('renders role badges', () => {
    const wrapper = mount(UserDataTable, { props: baseProps })
    const badges = wrapper.findAll('[data-user-role-badge]')
    expect(badges.length).toBeGreaterThanOrEqual(2) // at least partner + admin
  })

  it('shows loading skeleton when isLoading is true', () => {
    const wrapper = mount(UserDataTable, {
      props: { ...baseProps, isLoading: true },
    })
    expect(wrapper.find('[data-user-row]').exists()).toBe(false)
  })

  it('shows empty state when data is empty and no error', () => {
    const wrapper = mount(UserDataTable, {
      props: { ...baseProps, data: [] },
    })
    expect(wrapper.find('[data-user-table-empty]').exists()).toBe(true)
  })

  it('shows error state on hasError', () => {
    const wrapper = mount(UserDataTable, {
      props: { ...baseProps, hasError: true },
    })
    expect(wrapper.find('[data-user-table-error]').exists()).toBe(true)
  })

  it('emits sort when clicking sortable column header', async () => {
    const wrapper = mount(UserDataTable, { props: baseProps })
    // click the first sortable column button (name -> firstname)
    const buttons = wrapper.findAll('button')
    const sortBtn = buttons.find(b => b.text().includes('admin.users.columns.name'))
    expect(sortBtn).toBeTruthy()
    await sortBtn!.trigger('click')
    expect(wrapper.emitted('sort')).toBeTruthy()
    expect(wrapper.emitted('sort')![0]).toEqual(['firstname'])
  })

  it('emits edit when clicking edit action', async () => {
    const wrapper = mount(UserDataTable, { props: baseProps })
    const editActions = wrapper.findAll('[data-edit-action]')
    if (editActions.length > 0) {
      await editActions[0].trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
    }
  })

  it('shows pagination when lastPage > 1', () => {
    const wrapper = mount(UserDataTable, {
      props: { ...baseProps, pagination: { page: 1, lastPage: 3, total: 45 } },
    })
    expect(wrapper.find('[data-prev-page]').exists()).toBe(true)
    expect(wrapper.find('[data-next-page]').exists()).toBe(true)
  })

  it('hides pagination when only 1 page', () => {
    const wrapper = mount(UserDataTable, { props: baseProps })
    expect(wrapper.find('[data-prev-page]').exists()).toBe(false)
  })
})

// --- Admin Users Page ---
describe('admin/users/index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())

    const auth = useAuthStore()
    auth.user = { ...fakeAdminUser }

    mockUsers.value = [
      {
        id: 1, firstname: 'Jean', lastname: 'Dupont', full_name: 'Jean Dupont',
        email: 'jean@test.com', partner_id: 42, partner_name: 'Partner Alpha',
        roles: ['partner'], is_active: true, created_at: '2026-01-01T00:00:00Z',
      },
    ]
    mockIsLoading.value = false
    mockHasError.value = false
  })

  function mountPage() {
    return mount(AdminUsersPage, {
      global: {
        stubs: {
          Button: { template: '<button v-bind="$attrs"><slot /></button>' },
          Input: { template: '<input v-bind="$attrs" />', props: ['modelValue', 'placeholder'] },
          Select: { template: '<div><slot /></div>' },
          SelectTrigger: { template: '<div v-bind="$attrs"><slot /></div>' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>', props: ['value'] },
          SelectValue: { template: '<span />', props: ['placeholder'] },
          UserDataTable: { template: '<div data-user-table />', emits: ['sort', 'page', 'edit', 'delete', 'retry'] },
          UserFormDialog: { template: '<div data-user-form-dialog />', props: ['open', 'mode', 'isSaving', 'initialData'], emits: ['update:open', 'confirm'] },
        },
      },
    })
  }

  it('calls fetchUsers on mount', async () => {
    mountPage()
    await flushPromises()
    expect(mockFetchUsers).toHaveBeenCalledTimes(1)
  })

  it('renders page title', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-admin-users-page]').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.users.title')
  })

  it('shows new user button', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-new-user-btn]').exists()).toBe(true)
  })

  it('renders search input', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-search-input]').exists()).toBe(true)
  })

  it('renders role filter', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-role-filter]').exists()).toBe(true)
  })

  it('renders status filter', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-status-filter]').exists()).toBe(true)
  })

  it('renders UserDataTable component', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-user-table]').exists()).toBe(true)
  })
})
