import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'
import type { VariableSchema } from '@/types/admin'

vi.stubGlobal('definePageMeta', vi.fn())
mockUseI18n()

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('useRoute', () => ({
  params: {
    uuid: 'schema-uuid',
  },
}))

const current = ref<VariableSchema | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const createSchema = vi.fn(async () => true)
const fetchSchema = vi.fn(async () => current.value)
const updateSchema = vi.fn(async () => true)

vi.stubGlobal('useVariableSchemas', () => ({
  current,
  isLoading,
  isSaving,
  createSchema,
  fetchSchema,
  updateSchema,
}))

const NewPage = (await import('@/pages/admin/variable-schemas/new.vue')).default
const EditPage = (await import('@/pages/admin/variable-schemas/[uuid].vue')).default

const VariableSchemaFormStub = {
  template: `
    <button
      data-form-stub-submit
      @click="$emit('submit', {
        partner_id: 42,
        name: 'Schema test',
        global_data: null,
        recipient_preview_data: null,
        fields: [{ name: 'prenom', is_global: false, is_used: false }]
      })"
    >
      submit
    </button>
  `,
  props: ['initialData', 'mode', 'isSaving'],
}

describe('admin variable schema editor pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    current.value = {
      id: 1,
      uuid: 'created-uuid',
      partner_id: 42,
      name: 'Created schema',
      global_data: null,
      recipient_preview_data: null,
      fields: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      partner: null,
    }
    isLoading.value = false
    isSaving.value = false
  })

  function mountPage(component: object) {
    return mount(component, {
      global: {
        stubs: {
          VariableSchemaForm: VariableSchemaFormStub,
          PageSkeleton: { template: '<div data-skeleton />' },
          EmptyState: { template: '<div data-empty-state />', props: ['title', 'description', 'actionLabel', 'actionTo'] },
        },
      },
    })
  }

  it('creates a schema and redirects to the edit page', async () => {
    const wrapper = mountPage(NewPage)

    await wrapper.get('[data-form-stub-submit]').trigger('click')
    await flushPromises()

    expect(createSchema).toHaveBeenCalled()
    expect(navigateToMock).toHaveBeenCalledWith('/admin/variable-schemas/created-uuid')
  })

  it('loads the schema before rendering the edit form', async () => {
    const wrapper = mountPage(EditPage)
    await flushPromises()

    expect(fetchSchema).toHaveBeenCalledWith('schema-uuid')
    expect(wrapper.find('[data-form-stub-submit]').exists()).toBe(true)
  })

  it('submits updates from the edit page', async () => {
    const wrapper = mountPage(EditPage)
    await flushPromises()

    await wrapper.get('[data-form-stub-submit]').trigger('click')

    expect(updateSchema).toHaveBeenCalledWith('schema-uuid', expect.objectContaining({
      name: 'Schema test',
    }))
  })
})
