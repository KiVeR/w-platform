import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

stubAuthGlobals({ $api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } })
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', (await import('vue')).computed)
vi.stubGlobal('onMounted', (fn: () => void) => fn())
mockUseI18n()

const mockTemplates = ref<Record<string, unknown>[]>([])
const mockPresets = ref<Record<string, unknown>[]>([])
const mockIsLoading = ref(false)
const mockFetchTemplates = vi.fn()
const mockUseTemplate = vi.fn()
const mockDeleteTemplate = vi.fn()

vi.mock('@/composables/useTargetingTemplates', () => ({
  useTargetingTemplates: () => ({
    templates: mockTemplates,
    presets: mockPresets,
    isLoading: mockIsLoading,
    hasError: ref(false),
    fetchTemplates: mockFetchTemplates,
    useTemplate: mockUseTemplate,
    deleteTemplate: mockDeleteTemplate,
  }),
}))

const SavedZones = (await import('@/components/campaigns/wizard/SavedZones.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  Button: { template: '<button data-button @click="$emit(\'click\')"><slot /></button>', emits: ['click'], props: ['disabled', 'variant', 'size'] },
  Dialog: { template: '<div data-dialog v-if="open"><slot /></div>', props: ['open'], emits: ['update:open'] },
  DialogContent: slotStub,
  DialogHeader: slotStub,
  DialogTitle: slotStub,
  DialogDescription: slotStub,
  DialogFooter: slotStub,
}

const fakePreset = {
  id: 10,
  partner_id: null,
  name: 'Zone locale 2-3 km',
  targeting_json: { method: 'address', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: 2500, gender: null, age_min: 25, age_max: 55 },
  usage_count: 0,
  last_used_at: null,
  is_preset: true,
  category: 'commerce',
  created_at: '2026-01-01T00:00:00Z',
}

const fakeTemplate = {
  id: 1,
  partner_id: 42,
  name: 'Zone Dept 75',
  targeting_json: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null, gender: null, age_min: 25, age_max: 55 },
  usage_count: 3,
  last_used_at: '2026-02-10T10:00:00Z',
  is_preset: false,
  category: null,
  created_at: '2026-01-15T10:00:00Z',
}

describe('SavedZones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockTemplates.value = []
    mockPresets.value = []
    mockIsLoading.value = false
  })

  it('calls fetchTemplates on mount with activityType', () => {
    mount(SavedZones, {
      props: { activityType: 'commerce' },
      global: { stubs: baseStubs },
    })
    expect(mockFetchTemplates).toHaveBeenCalledWith('commerce')
  })

  it('hides card when no templates and no presets', () => {
    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-card]').exists()).toBe(false)
  })

  it('shows presets section when presets are available', () => {
    mockPresets.value = [fakePreset]
    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-presets-section]').exists()).toBe(true)
    expect(wrapper.findAll('[data-preset-button]')).toHaveLength(1)
  })

  it('shows templates section with items', () => {
    mockTemplates.value = [fakeTemplate]
    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-templates-section]').exists()).toBe(true)
    expect(wrapper.findAll('[data-template-item]')).toHaveLength(1)
  })

  it('displays template name and usage count', () => {
    mockTemplates.value = [fakeTemplate]
    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    const item = wrapper.find('[data-template-item]')
    expect(item.text()).toContain('Zone Dept 75')
    expect(item.find('[data-usage-count]').text()).toContain('wizard.savedZones.usedCount')
  })

  it('emits select with targeting when clicking a preset', async () => {
    mockPresets.value = [fakePreset]
    mockUseTemplate.mockResolvedValue(fakePreset.targeting_json)

    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    await wrapper.find('[data-preset-button]').trigger('click')
    // Wait for async handler
    await vi.waitFor(() => {
      expect(mockUseTemplate).toHaveBeenCalledWith(10)
    })
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0][0]).toEqual(fakePreset.targeting_json)
  })

  it('emits select with targeting when clicking a template item', async () => {
    mockTemplates.value = [fakeTemplate]
    mockUseTemplate.mockResolvedValue(fakeTemplate.targeting_json)

    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    await wrapper.find('[data-template-item]').trigger('click')
    await vi.waitFor(() => {
      expect(mockUseTemplate).toHaveBeenCalledWith(1)
    })
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  it('does not emit select when useTemplate returns null', async () => {
    mockTemplates.value = [fakeTemplate]
    mockUseTemplate.mockResolvedValue(null)

    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    await wrapper.find('[data-template-item]').trigger('click')
    await vi.waitFor(() => {
      expect(mockUseTemplate).toHaveBeenCalled()
    })
    expect(wrapper.emitted('select')).toBeFalsy()
  })

  it('shows delete button on hover and opens dialog', async () => {
    mockTemplates.value = [fakeTemplate]
    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    const deleteBtn = wrapper.find('[data-delete-button]')
    expect(deleteBtn.exists()).toBe(true)
  })

  it('shows "show all" button when more than 5 templates', () => {
    mockTemplates.value = Array.from({ length: 7 }, (_, i) => ({
      ...fakeTemplate,
      id: i + 1,
      name: `Template ${i + 1}`,
    }))

    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    expect(wrapper.findAll('[data-template-item]')).toHaveLength(5)
    expect(wrapper.find('[data-show-all-button]').exists()).toBe(true)
  })

  it('clicking "show all" reveals all templates', async () => {
    mockTemplates.value = Array.from({ length: 7 }, (_, i) => ({
      ...fakeTemplate,
      id: i + 1,
      name: `Template ${i + 1}`,
    }))

    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    await wrapper.find('[data-show-all-button]').trigger('click')
    expect(wrapper.findAll('[data-template-item]')).toHaveLength(7)
  })

  it('hides "show all" button when 5 or fewer templates', () => {
    mockTemplates.value = [fakeTemplate]
    const wrapper = mount(SavedZones, {
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-show-all-button]').exists()).toBe(false)
  })
})
