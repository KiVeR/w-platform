import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { mockUseI18n } from '../../helpers/stubs'
import type { Router } from '@/types/admin'

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
mockUseI18n()

const routers = ref<Router[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const hasError = ref(false)
const deleteError = ref<'in_use' | null>(null)
const fetchRouters = vi.fn(async () => {})
const createRouter = vi.fn(async () => true)
const updateRouter = vi.fn(async () => true)
const deleteRouter = vi.fn(async () => true)
const clearDeleteError = vi.fn()

vi.stubGlobal('useRouters', () => ({
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
}))

const Page = (await import('@/pages/admin/routers.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const ButtonStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
}
const RouterFormDialogStub = {
  props: ['open', 'router', 'isLoading'],
  template: `
    <div v-if="open" data-router-dialog>
      <span data-router-dialog-mode>{{ router ? router.name : 'create' }}</span>
      <button
        data-router-dialog-submit
        @click="$emit('submit', { name: router?.name ?? 'Primary', external_id: 12, num_stop: '36063', is_active: true })"
      >
        submit
      </button>
    </div>
  `,
}

describe('admin routers page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routers.value = [{
      id: 1,
      name: 'Primary',
      external_id: 12,
      num_stop: '36063',
      is_active: true,
      partners_count: 2,
      campaigns_count: 5,
      created_at: '2026-03-13T10:00:00Z',
      updated_at: '2026-03-13T10:00:00Z',
    }]
    isLoading.value = false
    isSaving.value = false
    hasError.value = false
    deleteError.value = null
  })

  function mountPage() {
    return mount(Page, {
      global: {
        stubs: {
          RouterFormDialog: RouterFormDialogStub,
          PageSkeleton: { template: '<div data-skeleton />', props: ['variant'] },
          EmptyState: { template: '<div data-empty><slot /></div>', props: ['icon', 'title', 'description', 'actionLabel', 'actionTo'] },
          Alert: slotStub,
          AlertTitle: slotStub,
          AlertDescription: slotStub,
          Table: { template: '<table><slot /></table>' },
          TableHeader: { template: '<thead><slot /></thead>' },
          TableBody: { template: '<tbody><slot /></tbody>' },
          TableRow: { template: '<tr><slot /></tr>' },
          TableHead: { template: '<th><slot /></th>' },
          TableCell: { template: '<td><slot /></td>' },
          Badge: { template: '<span><slot /></span>' },
          Button: ButtonStub,
          AlertDialog: slotStub,
          AlertDialogContent: slotStub,
          AlertDialogHeader: slotStub,
          AlertDialogTitle: slotStub,
          AlertDialogDescription: slotStub,
          AlertDialogFooter: slotStub,
          AlertDialogCancel: ButtonStub,
          AlertDialogAction: ButtonStub,
        },
      },
    })
  }

  it('fetches routers on mount and renders the table rows', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(fetchRouters).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-admin-page="routers"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Primary')
    expect(wrapper.text()).toContain('36063')
  })

  it('opens create mode and submits a new router', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-router-create]').trigger('click')
    expect(wrapper.get('[data-router-dialog-mode]').text()).toBe('create')

    await wrapper.get('[data-router-dialog-submit]').trigger('click')
    await flushPromises()

    expect(createRouter).toHaveBeenCalledWith({
      name: 'Primary',
      external_id: 12,
      num_stop: '36063',
      is_active: true,
    })
  })

  it('opens edit mode with the selected router', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-router-edit]').trigger('click')

    expect(wrapper.get('[data-router-dialog-mode]').text()).toBe('Primary')
  })

  it('confirms delete and calls the composable action', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-router-delete]').trigger('click')
    await wrapper.get('[data-router-delete-confirm]').trigger('click')
    await flushPromises()

    expect(deleteRouter).toHaveBeenCalledWith(1)
  })

  it('shows the conflict alert when delete is blocked', async () => {
    deleteRouter.mockImplementationOnce(async () => {
      deleteError.value = 'in_use'
      return false
    })

    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-router-delete]').trigger('click')
    await wrapper.get('[data-router-delete-confirm]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-router-delete-alert]').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.routers.alerts.deleteInUseTitle')
  })
})
