import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { mockUseI18n, NuxtLinkStub } from '../../helpers/stubs'
import type { VariableSchema } from '@/types/admin'

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
mockUseI18n()

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)

const schemas = ref<VariableSchema[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const hasError = ref(false)
const fetchSchemas = vi.fn(async () => {})
const deleteSchema = vi.fn(async () => true)
const cloneSchema = vi.fn(async () => ({
  id: 2,
  uuid: 'cloned-uuid',
  partner_id: 42,
  name: 'Schema test (copy)',
  global_data: null,
  recipient_preview_data: null,
  fields: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  partner: null,
}))

vi.stubGlobal('useVariableSchemas', () => ({
  schemas,
  isLoading,
  isSaving,
  hasError,
  fetchSchemas,
  deleteSchema,
  cloneSchema,
}))

const Page = (await import('@/pages/admin/variable-schemas/index.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const ButtonStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
}
const DropdownItemStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
  inheritAttrs: false,
}
const VariableCloneDialogStub = {
  template: '<button v-if="open" data-clone-confirm @click="$emit(\'confirm\')">clone</button>',
  props: ['open', 'schema', 'isLoading'],
}

describe('admin variable schemas index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    schemas.value = [{
      id: 1,
      uuid: 'schema-uuid',
      partner_id: 42,
      name: 'Schema test',
      global_data: null,
      recipient_preview_data: null,
      fields: [
        {
          id: 7,
          name: 'prenom',
          is_used: false,
          is_global: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      partner: { id: 42, name: 'Test Partner' },
    }]
    isLoading.value = false
    isSaving.value = false
    hasError.value = false
  })

  function mountPage() {
    return mount(Page, {
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
          PageSkeleton: { template: '<div data-skeleton />', props: ['variant'] },
          EmptyState: { template: '<div data-empty><slot /></div>', props: ['icon', 'title', 'description', 'actionLabel', 'actionTo'] },
          VariableCloneDialog: VariableCloneDialogStub,
          Table: { template: '<table><slot /></table>' },
          TableHeader: { template: '<thead><slot /></thead>' },
          TableBody: { template: '<tbody><slot /></tbody>' },
          TableRow: { template: '<tr><slot /></tr>' },
          TableHead: { template: '<th><slot /></th>' },
          TableCell: { template: '<td><slot /></td>' },
          Badge: { template: '<span><slot /></span>' },
          Button: ButtonStub,
          DropdownMenu: slotStub,
          DropdownMenuTrigger: slotStub,
          DropdownMenuContent: slotStub,
          DropdownMenuItem: DropdownItemStub,
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

  it('fetches schemas on mount and renders the table header and rows', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(fetchSchemas).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Schema test')
    expect(wrapper.text()).toContain('Test Partner')
    expect(wrapper.find('[data-schema-create]').exists()).toBe(true)
  })

  it('clones a schema and navigates to the cloned placeholder page', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-clone-action]').trigger('click')
    await wrapper.get('[data-clone-confirm]').trigger('click')
    await flushPromises()

    expect(cloneSchema).toHaveBeenCalledWith('schema-uuid')
    expect(navigateToMock).toHaveBeenCalledWith('/admin/variable-schemas/cloned-uuid')
  })

  it('deletes a schema when the confirmation button is clicked', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-delete-action]').trigger('click')
    await wrapper.get('[data-schema-delete-confirm]').trigger('click')
    await flushPromises()

    expect(deleteSchema).toHaveBeenCalledWith('schema-uuid')
  })
})
