import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.stubGlobal('useI18n', () => ({
  t: (key: string, params?: Record<string, string>) => {
    if (key === 'admin.variableSchemas.cloneDialog.description') {
      return `${key}:${params?.name ?? ''}`
    }
    return key
  },
}))

const VariableCloneDialog = (await import('@/components/admin/variable-schemas/VariableCloneDialog.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const ButtonStub = {
  template: '<button v-bind="$attrs"><slot /></button>',
}

describe('VariableCloneDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountDialog() {
    return mount(VariableCloneDialog, {
      props: {
        open: true,
        schema: {
          id: 1,
          uuid: 'schema-uuid',
          partner_id: 42,
          name: 'Schema test',
          global_data: null,
          recipient_preview_data: null,
          fields: [],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          partner: null,
        },
      },
      global: {
        stubs: {
          Dialog: slotStub,
          DialogContent: slotStub,
          DialogDescription: slotStub,
          DialogFooter: slotStub,
          DialogHeader: slotStub,
          DialogTitle: slotStub,
          Button: ButtonStub,
        },
      },
    })
  }

  it('renders the selected schema name in the description', () => {
    const wrapper = mountDialog()
    expect(wrapper.text()).toContain('Schema test')
  })

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = mountDialog()
    await wrapper.get('[data-variable-clone-confirm]').trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits update:open false when cancel is clicked', async () => {
    const wrapper = mountDialog()
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
