import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../helpers/stubs'

vi.stubGlobal('definePageMeta', vi.fn())
mockUseI18n()

const RouterAdminPage = (await import('@/pages/admin/routers.vue')).default
const VariableSchemaNewPage = (await import('@/pages/admin/variable-schemas/new.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const EmptyStateStub = {
  template: `
    <div data-empty-state>
      <span>{{ title }}</span>
      <span>{{ description }}</span>
      <span v-if="actionLabel">{{ actionLabel }}</span>
    </div>
  `,
  props: ['title', 'description', 'actionLabel'],
}

describe('admin placeholder pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountPage(component: object) {
    return mount(component, {
      global: {
        stubs: {
          Card: slotStub,
          CardHeader: slotStub,
          CardTitle: slotStub,
          CardDescription: slotStub,
          CardContent: slotStub,
          EmptyState: EmptyStateStub,
        },
      },
    })
  }

  it('renders routers placeholder page', () => {
    const wrapper = mountPage(RouterAdminPage)

    expect(wrapper.find('[data-admin-page="routers"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.routers.title')
    expect(wrapper.text()).toContain('admin.routers.placeholderTitle')
    expect(wrapper.text()).toContain('admin.backToDashboard')
  })

  it('renders variable schemas placeholder page', () => {
    const wrapper = mountPage(VariableSchemaNewPage)

    expect(wrapper.find('[data-schema-editor-page="new"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.variableSchemas.newPage.title')
    expect(wrapper.text()).toContain('admin.variableSchemas.editorPlaceholder.title')
  })
})
