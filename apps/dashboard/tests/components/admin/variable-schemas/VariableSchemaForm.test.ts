import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAdmin: false,
  }),
}))

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 42,
    currentPartnerName: 'Test Partner',
  }),
}))

vi.stubGlobal('useI18n', () => ({
  t: (key: string, params?: Record<string, string | number>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}))

const VariableSchemaForm = (await import('@/components/admin/variable-schemas/VariableSchemaForm.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const WizardStepperStub = {
  props: ['currentStep'],
  template: '<div data-stepper>{{ currentStep }}</div>',
}
const InputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <input
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  `,
}
const TextareaStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <textarea
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `,
}
const SwitchStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <input
      v-bind="$attrs"
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
    >
  `,
}
const ButtonStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
}
const DiscoverDialogStub = {
  props: ['open'],
  emits: ['update:open', 'apply'],
  template: `
    <div v-if="open" data-discover-dialog-stub>
      <button
        data-discover-apply
        @click="$emit('apply', {
          partner_id: 42,
          name: 'CSV schema',
          global_data: { sender: 'WELLPACK' },
          recipient_preview_data: { prenom: 'Marie' },
          fields: [{ name: 'prenom', is_global: false, is_used: false }]
        })"
      >
        apply
      </button>
    </div>
  `,
}

describe('VariableSchemaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountForm(props?: Record<string, unknown>) {
    return mount(VariableSchemaForm, {
      props,
      global: {
        stubs: {
          VariableDiscoverDialog: DiscoverDialogStub,
          WizardStepper: WizardStepperStub,
          Alert: slotStub,
          AlertTitle: slotStub,
          AlertDescription: slotStub,
          Badge: slotStub,
          Button: ButtonStub,
          Card: slotStub,
          CardHeader: slotStub,
          CardTitle: slotStub,
          CardDescription: slotStub,
          CardContent: slotStub,
          Input: InputStub,
          Label: slotStub,
          Separator: slotStub,
          Switch: SwitchStub,
          Textarea: TextareaStub,
        },
      },
    })
  }

  async function moveToFields(wrapper: ReturnType<typeof mountForm>) {
    await wrapper.get('[data-schema-name]').setValue('Schema test')
    await wrapper.get('[data-form-next]').trigger('click')
  }

  async function moveToDatasets(wrapper: ReturnType<typeof mountForm>) {
    await moveToFields(wrapper)
    await wrapper.get('[data-schema-field-add]').trigger('click')
    await wrapper.get('[data-schema-field-name]').setValue('prenom')
    await wrapper.get('[data-form-next]').trigger('click')
  }

  it('keeps the user on step 1 when the name is missing', async () => {
    const wrapper = mountForm()

    await wrapper.get('[data-form-next]').trigger('click')

    expect(wrapper.find('[data-schema-step="identity"]').exists()).toBe(true)
    expect(wrapper.find('[data-schema-name-error]').exists()).toBe(true)
  })

  it('emits a normalized payload after the three steps', async () => {
    const wrapper = mountForm()

    await moveToDatasets(wrapper)
    await wrapper.get('[data-schema-global-json]').setValue('{"sender":"WELLPACK"}')
    await wrapper.get('[data-schema-recipient-json]').setValue('{"prenom":"Marie"}')
    await wrapper.get('[data-form-submit]').trigger('click')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      partner_id: 42,
      name: 'Schema test',
      global_data: { sender: 'WELLPACK' },
      recipient_preview_data: { prenom: 'Marie' },
      fields: [{ name: 'prenom', is_global: false, is_used: false }],
    })
  })

  it('applies the CSV discovery payload into the form', async () => {
    const wrapper = mountForm()

    await wrapper.get('[data-schema-discover-open]').trigger('click')
    await wrapper.get('[data-discover-apply]').trigger('click')

    expect(wrapper.find('[data-schema-step="fields"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-schema-field-row]')).toHaveLength(1)
    expect((wrapper.get('[data-schema-field-name]').element as HTMLInputElement).value).toBe('prenom')
  })

  it('hydrates the form from the initial schema in edit mode', async () => {
    const wrapper = mountForm({
      mode: 'edit',
      initialData: {
        id: 1,
        uuid: 'schema-uuid',
        partner_id: 42,
        name: 'Existing schema',
        global_data: { sender: 'WELLPACK' },
        recipient_preview_data: { prenom: 'Jean' },
        fields: [
          {
            id: 7,
            name: 'prenom',
            is_global: false,
            is_used: true,
            created_at: null,
            updated_at: null,
          },
        ],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        partner: null,
      },
    })

    expect((wrapper.get('[data-schema-name]').element as HTMLInputElement).value).toBe('Existing schema')
    expect(wrapper.find('[data-schema-step="identity"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.variableSchemas.form.mode.edit.title')
  })
})
