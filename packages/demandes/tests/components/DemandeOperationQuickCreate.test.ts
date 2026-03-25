import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive, computed } from 'vue'
import { mockUseI18n, mockNuxtApp } from '../helpers/stubs'
import DemandeOperationQuickCreate from '../../components/DemandeOperationQuickCreate.vue'
import { toast as mockToast } from '../__mocks__/vue-sonner'

const globalStubs = {
  stubs: {
    Button: {
      template: '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
      props: ['disabled', 'size', 'variant'],
      emits: ['click'],
      inheritAttrs: false,
    },
    Input: {
      template: '<input v-bind="$attrs" :data-testid="$attrs[\'data-testid\']" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue', 'placeholder', 'type'],
      emits: ['update:modelValue'],
      inheritAttrs: false,
    },
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  mockUseI18n()
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('computed', computed)
  // Reset toast mocks
  mockToast.success.mockReset()
  mockToast.error.mockReset()
})

function mountComponent(props = { demandeId: 42 }) {
  return mount(DemandeOperationQuickCreate, {
    props,
    global: globalStubs,
  })
}

async function openForm(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-testid="add-operation-btn"]').trigger('click')
}

describe('DemandeOperationQuickCreate', () => {
  it('renders add button in closed state', () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="add-operation-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quick-create-form"]').exists()).toBe(false)
  })

  it('opens form on button click', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()

    await openForm(wrapper)

    expect(wrapper.find('[data-testid="quick-create-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="add-operation-btn"]').exists()).toBe(false)
  })

  it('renders 9 type pills', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    const pills = wrapper.findAll('[data-testid^="type-pill-"]')
    expect(pills).toHaveLength(9)
  })

  it('selects type on pill click', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')

    const pill = wrapper.find('[data-testid="type-pill-loc"]')
    expect(pill.classes()).toContain('bg-primary')
  })

  it('deselects previous type when new one clicked', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="type-pill-fid"]').trigger('click')

    expect(wrapper.find('[data-testid="type-pill-loc"]').classes()).not.toContain('bg-primary')
    expect(wrapper.find('[data-testid="type-pill-fid"]').classes()).toContain('bg-primary')
  })

  it('renders name input', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true)
  })

  it('renders advertiser input', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    expect(wrapper.find('[data-testid="advertiser-input"]').exists()).toBe(true)
  })

  it('renders 3 priority options', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    expect(wrapper.find('[data-testid="priority-option-high"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="priority-option-medium"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="priority-option-low"]').exists()).toBe(true)
  })

  it('defaults priority to medium', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    const mediumRadio = wrapper.find('[data-testid="priority-option-medium"] input[type="radio"]')
    expect((mediumRadio.element as HTMLInputElement).checked).toBe(true)
  })

  it('disables submit when no type selected', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    // Set name but no type
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')

    const submitBtn = wrapper.find('[data-testid="submit-btn"]')
    expect((submitBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables submit when name is empty', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    // Select type but no name
    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')

    const submitBtn = wrapper.find('[data-testid="submit-btn"]')
    expect((submitBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables submit when type and name filled', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')

    const submitBtn = wrapper.find('[data-testid="submit-btn"]')
    expect((submitBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('sends POST /operations on submit', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledWith('/operations', expect.objectContaining({
      body: expect.objectContaining({ type: 'loc', name: 'Test op' }),
    }))
  })

  it('includes demande_id in payload', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent({ demandeId: 42 })
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-fid"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Fid op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledWith('/operations', expect.objectContaining({
      body: expect.objectContaining({ demande_id: 42 }),
    }))
  })

  it('includes selected type in payload', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-acq"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Acq op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledWith('/operations', expect.objectContaining({
      body: expect.objectContaining({ type: 'acq' }),
    }))
  })

  it('includes advertiser when filled', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    await wrapper.find('[data-testid="advertiser-input"]').setValue('Acme')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledWith('/operations', expect.objectContaining({
      body: expect.objectContaining({ advertiser: 'Acme' }),
    }))
  })

  it('sends null advertiser when empty', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    // advertiser left empty
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledWith('/operations', expect.objectContaining({
      body: expect.objectContaining({ advertiser: null }),
    }))
  })

  it('sends selected priority', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    // default is medium
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledWith('/operations', expect.objectContaining({
      body: expect.objectContaining({ priority: 'medium' }),
    }))
  })

  it('shows success toast on creation', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith('demandes.operations.created')
  })

  it('emits created event', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('created')).toBeTruthy()
  })

  it('closes form after creation', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="quick-create-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="add-operation-btn"]').exists()).toBe(true)
  })

  it('resets form on reopen', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()

    // Open and fill
    await openForm(wrapper)
    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Old name')

    // Submit to close
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    // Reopen
    await openForm(wrapper)

    const nameInput = wrapper.find('[data-testid="name-input"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('')
    // Type pills should be deselected
    expect(wrapper.find('[data-testid="type-pill-loc"]').classes()).not.toContain('bg-primary')
  })

  it('shows error toast on API error', async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: null, error: { message: 'Server error' } })
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('demandes.operations.create_error')
    expect(wrapper.find('[data-testid="quick-create-form"]').exists()).toBe(true)
  })

  it('disables submit during loading', async () => {
    let resolvePost!: (val: unknown) => void
    const mockPost = vi.fn().mockReturnValue(new Promise(resolve => { resolvePost = resolve }))
    mockNuxtApp({ POST: mockPost })
    const wrapper = mountComponent()
    await openForm(wrapper)

    await wrapper.find('[data-testid="type-pill-loc"]').trigger('click')
    await wrapper.find('[data-testid="name-input"]').setValue('Test op')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')

    expect((wrapper.find('[data-testid="submit-btn"]').element as HTMLButtonElement).disabled).toBe(true)

    resolvePost({ data: {}, error: null })
    await flushPromises()
  })

  it('closes form on cancel', async () => {
    mockNuxtApp({ POST: vi.fn() })
    const wrapper = mountComponent()
    await openForm(wrapper)

    expect(wrapper.find('[data-testid="quick-create-form"]').exists()).toBe(true)

    await wrapper.find('[data-testid="cancel-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="quick-create-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="add-operation-btn"]').exists()).toBe(true)
  })
})
