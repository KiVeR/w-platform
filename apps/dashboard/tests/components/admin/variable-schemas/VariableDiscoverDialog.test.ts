import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
}))

const discoverFromCsv = vi.fn()
const isSaving = ref(false)

vi.stubGlobal('useVariableSchemas', () => ({
  discoverFromCsv,
  isSaving,
}))

const VariableDiscoverDialog = (await import('@/components/admin/variable-schemas/VariableDiscoverDialog.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const InputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue', 'change'],
  template: `
    <input
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @change="$emit('change', $event)"
    >
  `,
}
const ButtonStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
}

describe('VariableDiscoverDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSaving.value = false
  })

  function mountDialog() {
    return mount(VariableDiscoverDialog, {
      props: {
        open: true,
        initialName: 'Imported schema',
      },
      global: {
        stubs: {
          Dialog: slotStub,
          DialogContent: slotStub,
          DialogDescription: slotStub,
          DialogFooter: slotStub,
          DialogHeader: slotStub,
          DialogTitle: slotStub,
          Alert: slotStub,
          AlertTitle: slotStub,
          AlertDescription: slotStub,
          Label: slotStub,
          Input: InputStub,
          Button: ButtonStub,
        },
      },
    })
  }

  it('emits apply with the discovered form and closes the dialog', async () => {
    discoverFromCsv.mockResolvedValue({
      partner_id: 42,
      name: 'Imported schema',
      global_data: { sender: 'WELLPACK' },
      recipient_preview_data: { prenom: 'Marie' },
      fields: [{ name: 'prenom', is_global: false, is_used: false }],
    })

    const wrapper = mountDialog()
    const file = new File(['prenom\nMarie'], 'schema.csv', { type: 'text/csv' })
    const input = wrapper.get('[data-discover-file]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })

    await input.trigger('change')
    await wrapper.get('[data-discover-submit]').trigger('click')
    await flushPromises()

    expect(discoverFromCsv).toHaveBeenCalledWith('Imported schema', file)
    expect(wrapper.emitted('apply')?.[0]?.[0]).toMatchObject({
      name: 'Imported schema',
      global_data: { sender: 'WELLPACK' },
      recipient_preview_data: { prenom: 'Marie' },
    })
    expect(wrapper.emitted('update:open')).toContainEqual([false])
  })

  it('shows the backend pending message on 501', async () => {
    discoverFromCsv.mockResolvedValue('not_implemented')

    const wrapper = mountDialog()
    const file = new File(['prenom\nMarie'], 'schema.csv', { type: 'text/csv' })
    const input = wrapper.get('[data-discover-file]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })

    await input.trigger('change')
    await wrapper.get('[data-discover-submit]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-discover-backend-pending]').exists()).toBe(true)
    expect(wrapper.emitted('apply')).toBeUndefined()
  })

  it('keeps the submit button disabled while no file is selected', async () => {
    const wrapper = mountDialog()

    expect(wrapper.get('[data-discover-submit]').attributes('disabled')).toBeDefined()
    expect(discoverFromCsv).not.toHaveBeenCalled()
  })
})
