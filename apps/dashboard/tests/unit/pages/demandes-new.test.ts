import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed, reactive } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

// ---- Global stubs (must be before any imports that trigger the component) ----
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('computed', computed)
vi.stubGlobal('reactive', reactive)
mockUseI18n()

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
import { toast } from 'vue-sonner'

// Router stub
const routerPushMock = vi.fn()
vi.stubGlobal('useRouter', () => ({ push: routerPushMock }))
vi.stubGlobal('useScopedNavigation', () => ({ scopedRoute: (p: string) => p, hubRoute: (p: string) => p, enterPartner: vi.fn(), exitToHub: vi.fn() }))

// API stub
const mockPost = vi.fn()
const mockGet = vi.fn()
vi.stubGlobal('useNuxtApp', () => ({ $api: { POST: mockPost, GET: mockGet } }))

// PartnerStore stub — control admin vs non-admin
const effectivePartnerId = ref<number | null>(null)

// Mock partner store (imported directly by the page via `import { usePartnerStore } from '@/stores/partner'`)
vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    get effectivePartnerId() { return effectivePartnerId.value },
  }),
}))

vi.stubGlobal('usePartnerStore', () => ({
  effectivePartnerId: effectivePartnerId.value,
}))

// Import the page after all stubs are in place
const DemandesNew = (await import('@/pages/demandes/new.vue')).default

// ---- Shadcn component stubs ----
const CardStub = { template: '<div data-stub="card"><slot /></div>' }
const CardHeaderStub = { template: '<div data-stub="card-header"><slot /></div>', props: ['class'] }
const CardTitleStub = { template: '<div data-stub="card-title"><slot /></div>', props: ['class'] }
const CardContentStub = { template: '<div data-stub="card-content"><slot /></div>', props: ['class'] }
const LabelStub = { template: '<label><slot /></label>', props: ['for', 'class'] }
const InputStub = {
  template: '<input v-bind="$attrs" :data-testid="$attrs[\'data-testid\']" />',
  inheritAttrs: true,
}
const TextareaStub = {
  template: '<textarea v-bind="$attrs" :data-testid="$attrs[\'data-testid\']"></textarea>',
  inheritAttrs: true,
}
const SwitchStub = {
  template: '<button role="switch" v-bind="$attrs" :data-testid="$attrs[\'data-testid\']"><slot /></button>',
  inheritAttrs: true,
}
const ButtonStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  emits: ['click'],
}
const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// AsyncCombobox stub — renders a simplified version that exposes data-testid and emits update:modelValue
const AsyncComboboxStub = {
  template: '<div :data-testid="$attrs[\'data-testid\']" data-stub="async-combobox"><slot /></div>',
  props: ['modelValue', 'searchFn', 'placeholder', 'disabled', 'displayValue'],
  emits: ['update:modelValue'],
  inheritAttrs: true,
}

// Lucide icon stub
const ArrowLeftStub = { template: '<span />' }

function mountPage() {
  return mount(DemandesNew, {
    global: {
      stubs: {
        Card: CardStub,
        CardHeader: CardHeaderStub,
        CardTitle: CardTitleStub,
        CardContent: CardContentStub,
        Label: LabelStub,
        Input: InputStub,
        Textarea: TextareaStub,
        Switch: SwitchStub,
        Button: ButtonStub,
        NuxtLink: NuxtLinkStub,
        ArrowLeft: ArrowLeftStub,
        AsyncCombobox: AsyncComboboxStub,
      },
    },
  })
}

describe('demandes/new page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    effectivePartnerId.value = null
    // Re-stub usePartnerStore with the current effectivePartnerId value
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: effectivePartnerId.value,
    }))
  })

  it('renders creation form', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="create-form"]').exists()).toBe(true)
  })

  it('has ref_client field', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="ref-client-input"]').exists()).toBe(true)
  })

  it('has information textarea', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="information-textarea"]').exists()).toBe(true)
  })

  it('has is_exoneration switch', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="exoneration-switch"]').exists()).toBe(true)
  })

  it('has partner combobox for admin', () => {
    // effectivePartnerId is null → admin
    effectivePartnerId.value = null
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: null,
    }))
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="partner-field"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="partner-id-combobox"]').exists()).toBe(true)
  })

  it('hides partner combobox for non-admin', () => {
    // effectivePartnerId non-null → partner user
    effectivePartnerId.value = 5
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: 5,
    }))
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="partner-field"]').exists()).toBe(false)
  })

  it('has commercial and sdr comboboxes', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="commercial-id-combobox"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="sdr-id-combobox"]').exists()).toBe(true)
  })

  it('submits form successfully', async () => {
    // Use non-admin so canSubmit is true without needing partner_id field
    effectivePartnerId.value = 10
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: 10,
    }))
    mockPost.mockResolvedValueOnce({
      data: { data: { id: 42 } },
      error: null,
    })
    const wrapper = mountPage()
    await wrapper.find('[data-testid="create-form"]').trigger('submit')
    await flushPromises()
    expect(mockPost).toHaveBeenCalledWith('/demandes', expect.objectContaining({ body: expect.any(Object) }))
  })

  it('redirects to detail after creation', async () => {
    effectivePartnerId.value = 10
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: 10,
    }))
    mockPost.mockResolvedValueOnce({
      data: { data: { id: 99 } },
      error: null,
    })
    const wrapper = mountPage()
    await wrapper.find('[data-testid="create-form"]').trigger('submit')
    await flushPromises()
    expect(routerPushMock).toHaveBeenCalledWith('/demandes/99')
  })

  it('shows success toast after creation', async () => {
    effectivePartnerId.value = 10
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: 10,
    }))
    mockPost.mockResolvedValueOnce({
      data: { data: { id: 1 } },
      error: null,
    })
    const wrapper = mountPage()
    await wrapper.find('[data-testid="create-form"]').trigger('submit')
    await flushPromises()
    expect(toast.success).toHaveBeenCalledWith('demandes.create.success')
  })

  it('shows validation errors', async () => {
    effectivePartnerId.value = 10
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: 10,
    }))
    mockPost.mockResolvedValueOnce({
      data: null,
      error: {
        errors: {
          ref_client: ['La référence client est invalide.'],
        },
      },
    })
    const wrapper = mountPage()
    await wrapper.find('[data-testid="create-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('La référence client est invalide.')
  })

  it('disables submit during loading', async () => {
    // Use a never-resolving promise to keep isSubmitting = true
    mockPost.mockReturnValueOnce(new Promise(() => {}))
    const wrapper = mountPage()
    await wrapper.find('[data-testid="create-form"]').trigger('submit')
    await flushPromises()
    const submitBtn = wrapper.find('[data-testid="submit-button"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('has cancel button linking to /demandes', () => {
    const wrapper = mountPage()
    // The cancel button is inside a NuxtLink stub rendered as <a href="/demandes">
    const cancelLinks = wrapper.findAll('a[href="/demandes"]')
    expect(cancelLinks.length).toBeGreaterThan(0)
  })

  it('pre-fills partner_id for non-admin', () => {
    effectivePartnerId.value = 7
    vi.stubGlobal('usePartnerStore', () => ({
      effectivePartnerId: 7,
    }))
    // Mount component — form.partner_id should be initialized to 7
    // For non-admin, partner field is hidden but partner_id is set in form
    const wrapper = mountPage()
    // The partner field is hidden, confirming non-admin context
    expect(wrapper.find('[data-testid="partner-field"]').exists()).toBe(false)
    // The form contains the partner_id pre-filled (we verify through the component instance)
    const vm = wrapper.vm as any
    expect(vm.form.partner_id).toBe(7)
  })
})
