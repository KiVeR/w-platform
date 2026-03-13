import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
}))

const RouterFormDialog = (await import('@/components/admin/RouterFormDialog.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const ButtonStub = {
  template: '<button v-bind="$attrs"><slot /></button>',
}
const InputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const SwitchStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input type="checkbox" :checked="modelValue" v-bind="$attrs" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
}

describe('RouterFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountDialog(router: Record<string, unknown> | null = null) {
    return mount(RouterFormDialog, {
      props: {
        open: true,
        router,
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
          Input: InputStub,
          Label: slotStub,
          Switch: SwitchStub,
        },
      },
    })
  }

  it('validates that the name is required before submit', async () => {
    const wrapper = mountDialog()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.find('[data-router-name-error]').exists()).toBe(true)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits a normalized create payload', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-router-name]').setValue('Primary')
    await wrapper.get('[data-router-external-id]').setValue('12')
    await wrapper.get('[data-router-num-stop]').setValue('36063')
    await wrapper.get('[data-router-is-active]').setValue(false)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[
      {
        name: 'Primary',
        external_id: 12,
        num_stop: '36063',
        is_active: false,
      },
    ]])
  })

  it('prefills the form in edit mode', async () => {
    const wrapper = mountDialog({
      id: 3,
      name: 'Backup',
      external_id: 14,
      num_stop: '36111',
      is_active: false,
      partners_count: 1,
      campaigns_count: 0,
      created_at: null,
      updated_at: null,
    })

    expect((wrapper.get('[data-router-name]').element as HTMLInputElement).value).toBe('Backup')
    expect((wrapper.get('[data-router-external-id]').element as HTMLInputElement).value).toBe('14')
    expect((wrapper.get('[data-router-num-stop]').element as HTMLInputElement).value).toBe('36111')
    expect((wrapper.get('[data-router-is-active]').element as HTMLInputElement).checked).toBe(false)
  })

  it('emits update:open false when cancel is clicked', async () => {
    const wrapper = mountDialog()
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('click')

    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
