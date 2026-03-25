import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, reactive, ref } from 'vue'
import { mockUseI18n, mockNuxtApp } from '../helpers/stubs'
import DemandeFormCard from '../../components/DemandeFormCard.vue'
import type { DemandeDetail } from '../../types/demandes'

function makeDetail(overrides: Partial<DemandeDetail> = {}): DemandeDetail {
  return {
    id: 1,
    ref_demande: 'DEM-001',
    ref_client: 'CLI-42',
    information: 'Some info',
    is_exoneration: false,
    pays_id: null,
    partner_id: 10,
    commercial_id: null,
    sdr_id: null,
    operations_count: 6,
    operations_completed_count: 3,
    operations_blocked_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    partner: { id: 10, name: 'Acme Corp' },
    commercial: null,
    sdr: null,
    ...overrides,
  }
}

const globalStubs = {
  stubs: {
    Card: { template: '<div data-stub="card"><slot /></div>' },
    CardHeader: { template: '<div><slot /></div>' },
    CardTitle: { template: '<span><slot /></span>' },
    CardContent: { template: '<div><slot /></div>' },
    CardFooter: { template: '<div><slot /></div>' },
    Button: {
      template: '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
      props: ['disabled', 'size', 'variant'],
      emits: ['click'],
      inheritAttrs: false,
    },
    Label: { template: '<label><slot /></label>', props: ['for'] },
    Input: {
      template: '<input v-bind="$attrs" :data-testid="$attrs[\'data-testid\']" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue'],
      emits: ['update:modelValue'],
      inheritAttrs: false,
    },
    Textarea: {
      template: '<textarea v-bind="$attrs" :data-testid="$attrs[\'data-testid\']" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
      props: ['modelValue'],
      emits: ['update:modelValue'],
      inheritAttrs: false,
    },
    Switch: {
      template: '<button role="switch" v-bind="$attrs" :data-testid="$attrs[\'data-testid\']" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>',
      props: ['modelValue', 'id'],
      emits: ['update:modelValue'],
      inheritAttrs: false,
    },
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockUseI18n()
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
})

describe('DemandeFormCard', () => {
  it('renders ref_demande as readonly', () => {
    const mockPut = vi.fn()
    mockNuxtApp({ PUT: mockPut })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail() },
      global: globalStubs,
    })

    expect(wrapper.find('[data-testid="ref-demande"]').text()).toBe('DEM-001')
    // edit button exists in read mode (no save/cancel)
    expect(wrapper.find('[data-testid="save-button"]').exists()).toBe(false)
  })

  it('shows edit button in read mode', () => {
    mockNuxtApp({ PUT: vi.fn() })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail() },
      global: globalStubs,
    })

    expect(wrapper.find('[data-testid="edit-button"]').exists()).toBe(true)
  })

  it('switches to edit mode on edit button click', async () => {
    mockNuxtApp({ PUT: vi.fn() })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail() },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="edit-button"]').trigger('click')

    expect(wrapper.find('[data-testid="ref-client-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="save-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cancel-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="edit-button"]').exists()).toBe(false)
  })

  it('pre-fills form with demande values when editing', async () => {
    mockNuxtApp({ PUT: vi.fn() })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail({ ref_client: 'CLI-99', information: 'Details here' }) },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="edit-button"]').trigger('click')

    expect((wrapper.find('[data-testid="ref-client-input"]').element as HTMLInputElement).value).toBe('CLI-99')
    expect((wrapper.find('[data-testid="information-textarea"]').element as HTMLTextAreaElement).value).toBe('Details here')
  })

  it('calls PUT /demandes/{id} on save', async () => {
    const mockPut = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ PUT: mockPut })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail() },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="edit-button"]').trigger('click')
    await wrapper.find('[data-testid="save-button"]').trigger('click')
    await flushPromises()

    expect(mockPut).toHaveBeenCalledWith('/demandes/{id}', expect.objectContaining({
      params: { path: { id: 1 } },
    }))
  })

  it('emits updated event after successful save', async () => {
    const mockPut = vi.fn().mockResolvedValue({ data: {}, error: null })
    mockNuxtApp({ PUT: mockPut })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail() },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="edit-button"]').trigger('click')
    await wrapper.find('[data-testid="save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('updated')).toBeTruthy()
  })

  it('returns to read mode on cancel', async () => {
    mockNuxtApp({ PUT: vi.fn() })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail() },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="edit-button"]').trigger('click')
    expect(wrapper.find('[data-testid="save-button"]').exists()).toBe(true)

    await wrapper.find('[data-testid="cancel-button"]').trigger('click')

    expect(wrapper.find('[data-testid="edit-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="save-button"]').exists()).toBe(false)
  })

  it('disables save/cancel while saving', async () => {
    let resolvePut!: (val: unknown) => void
    const mockPut = vi.fn().mockReturnValue(new Promise(resolve => { resolvePut = resolve }))
    mockNuxtApp({ PUT: mockPut })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail() },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="edit-button"]').trigger('click')
    await wrapper.find('[data-testid="save-button"]').trigger('click')

    expect((wrapper.find('[data-testid="save-button"]').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.find('[data-testid="cancel-button"]').element as HTMLButtonElement).disabled).toBe(true)

    resolvePut({ data: {}, error: null })
    await flushPromises()
  })

  it('shows progress bar with correct width', () => {
    mockNuxtApp({ PUT: vi.fn() })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail({ operations_count: 4, operations_completed_count: 2 }) },
      global: globalStubs,
    })

    const progressBar = wrapper.find('[data-testid="progress-bar"]')
    expect(progressBar.attributes('style')).toContain('width: 50%')
  })

  it('shows progress label as completed/total', () => {
    mockNuxtApp({ PUT: vi.fn() })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail({ operations_count: 8, operations_completed_count: 5 }) },
      global: globalStubs,
    })

    expect(wrapper.find('[data-testid="progress-label"]').text()).toContain('5/8')
  })

  it('ref_demande stays readonly in edit mode', async () => {
    mockNuxtApp({ PUT: vi.fn() })

    const wrapper = mount(DemandeFormCard, {
      props: { demande: makeDetail({ ref_demande: 'DEM-READONLY' }) },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="edit-button"]').trigger('click')

    // ref_demande displayed as plain text, no input
    expect(wrapper.find('[data-testid="ref-demande"]').exists()).toBe(true)
    expect(wrapper.find('input[data-testid="ref-demande"]').exists()).toBe(false)
  })
})
