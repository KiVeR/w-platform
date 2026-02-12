import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref, watch } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

const mockPost = vi.fn()
const mockGet = vi.fn().mockResolvedValue({ data: { data: { activity_type: null } }, error: null })
stubAuthGlobals({ $api: { POST: mockPost, PUT: vi.fn(), GET: mockGet } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', (fn: () => void) => fn())
vi.stubGlobal('isForbiddenMessage', (msg: string) => msg.toLowerCase().includes('rsms.co'))
mockUseI18n()

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 42,
  }),
}))

const mockPrimaryShop = ref<{ latitude: number | null, longitude: number | null, address: string | null, city: string | null } | null>(null)
const mockFetchShops = vi.fn()

vi.mock('@/composables/usePartnerShops', () => ({
  usePartnerShops: () => ({
    primaryShop: mockPrimaryShop,
    shops: ref([]),
    isLoading: ref(false),
    fetchShops: mockFetchShops,
  }),
}))

// Mock useExpertMode — default to classic to preserve existing test behavior
const mockEffectiveMode = ref<'smart' | 'classic'>('classic')
const mockSetMode = vi.fn((mode: 'smart' | 'classic') => { mockEffectiveMode.value = mode })
const mockDetect = vi.fn()

vi.mock('@/composables/useExpertMode', () => ({
  useExpertMode: () => ({
    effectiveMode: mockEffectiveMode,
    isExpert: ref(false),
    isLoading: ref(false),
    storedMode: ref(null),
    campaignsTotal: ref(null),
    setMode: mockSetMode,
    detect: mockDetect,
  }),
}))

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const StepEstimate = (await import('@/components/campaigns/wizard/StepEstimate.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardDescription: slotStub,
  CardContent: slotStub,
  Badge: { template: '<span data-badge><slot /></span>' },
  Button: { template: '<button data-button @click="$emit(\'click\')"><slot /></button>', emits: ['click'], props: ['disabled'] },
  Switch: { template: '<input type="checkbox" data-switch :checked="modelValue" @change="$emit(\'update:modelValue\', !modelValue)" />', props: ['modelValue'], emits: ['update:modelValue'] },
  DepartmentSelector: { template: '<div data-department-selector />', props: ['modelValue'], emits: ['update:modelValue'] },
  PostcodeInput: { template: '<div data-postcode-input />', props: ['modelValue'], emits: ['update:modelValue'] },
  AddressRadius: { template: '<div data-address-radius />', props: ['address', 'lat', 'lng', 'radius'], emits: ['update:address', 'update:lat', 'update:lng', 'update:radius'] },
  SmartSearch: { template: '<div data-smart-search />', props: ['departments', 'postcodes', 'address', 'lat', 'lng', 'radius'], emits: ['select', 'remove-department', 'remove-postcode', 'clear-address', 'update:radius'] },
  TargetingMap: { template: '<div data-targeting-map />', props: ['method', 'departments', 'postcodes', 'address', 'lat', 'lng', 'radius', 'defaultCenter', 'defaultZoom'], emits: ['toggleDepartment'] },
  DemographicsSelector: { template: '<div data-demographics-selector />', props: ['modelValue'], emits: ['update:modelValue'] },
  ClientOnly: slotStub,
}

describe('StepEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrimaryShop.value = null
    mockEffectiveMode.value = 'classic'
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  // === Classic mode tests (existing, preserved) ===

  it('renders 3 method cards in classic mode', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.findAll('[data-method-card]')).toHaveLength(3)
  })

  it('department method is selected by default', () => {
    const wizard = useCampaignWizardStore()
    expect(wizard.campaign.targeting.method).toBe('department')

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const cards = wrapper.findAll('[data-method-card]')
    expect(cards[0].classes().some(c => c.includes('border-primary') || c.includes('ring'))).toBe(true)
  })

  it('clicking postcode card switches method', async () => {
    const wizard = useCampaignWizardStore()

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const cards = wrapper.findAll('[data-method-card]')
    await cards[1].trigger('click')

    expect(wizard.campaign.targeting.method).toBe('postcode')
  })

  it('shows DepartmentSelector when method is department', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-department-selector]').exists()).toBe(true)
  })

  it('shows PostcodeInput when method is postcode', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'postcode'

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-postcode-input]').exists()).toBe(true)
  })

  it('shows AddressRadius when method is address', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'address'

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-address-radius]').exists()).toBe(true)
  })

  it('renders map component', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-targeting-map]').exists()).toBe(true)
  })

  it('toggleDepartment from map updates store departments', () => {
    const wizard = useCampaignWizardStore()

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const map = wrapper.findComponent({ name: 'TargetingMap' })
    if (map.exists()) {
      map.vm.$emit('toggleDepartment', '75')
      expect(wizard.campaign.targeting.departments).toContain('75')
    }
  })

  it('renders DemographicsSelector inline', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-demographics-selector]').exists()).toBe(true)
  })


  // QW8 — Texte d'aide sous les cartes de méthode
  it('renders 3 method hints with i18n keys', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const hints = wrapper.findAll('[data-method-hint]')
    expect(hints).toHaveLength(3)
    expect(hints[0].text()).toBe('wizard.targeting.methods.department.hint')
    expect(hints[1].text()).toBe('wizard.targeting.methods.postcode.hint')
    expect(hints[2].text()).toBe('wizard.targeting.methods.address.hint')
  })

  it('hints are visible inside each method card', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const cards = wrapper.findAll('[data-method-card]')
    for (const card of cards) {
      expect(card.find('[data-method-hint]').exists()).toBe(true)
    }
  })


  // QW1 — My shop button
  it('shows "My shop" button when primaryShop has lat/lng', () => {
    mockPrimaryShop.value = { latitude: 45.75, longitude: 4.85, address: '12 rue de Lyon', city: 'Lyon' }
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-my-shop-button]').exists()).toBe(true)
    expect(wrapper.find('[data-my-shop-button]').text()).toContain('12 rue de Lyon')
  })

  it('hides "My shop" button when primaryShop has no lat/lng', () => {
    mockPrimaryShop.value = { latitude: null, longitude: null, address: '12 rue de Lyon', city: 'Lyon' }
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-my-shop-button]').exists()).toBe(false)
  })

  it('hides "My shop" button when no shop', () => {
    mockPrimaryShop.value = null
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-my-shop-button]').exists()).toBe(false)
  })

  it('clicking "My shop" sets targeting to address mode with lat/lng/radius', async () => {
    mockPrimaryShop.value = { latitude: 45.75, longitude: 4.85, address: '12 rue de Lyon', city: 'Lyon' }
    const wizard = useCampaignWizardStore()

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    await wrapper.find('[data-my-shop-button]').trigger('click')

    expect(wizard.campaign.targeting.method).toBe('address')
    expect(wizard.campaign.targeting.lat).toBe(45.75)
    expect(wizard.campaign.targeting.lng).toBe(4.85)
    expect(wizard.campaign.targeting.radius).toBe(3)
    expect(wizard.campaign.targeting.address).toContain('12 rue de Lyon')
  })

  it('clicking "My shop" sets radius to 3 (not default 10)', async () => {
    mockPrimaryShop.value = { latitude: 45.75, longitude: 4.85, address: '12 rue de Lyon', city: 'Lyon' }
    const wizard = useCampaignWizardStore()

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    await wrapper.find('[data-my-shop-button]').trigger('click')

    expect(wizard.campaign.targeting.radius).toBe(3)
  })

  // QW12 — TargetingMap receives defaultCenter from shop
  it('passes defaultCenter to TargetingMap when shop has coordinates', () => {
    mockPrimaryShop.value = { latitude: 45.75, longitude: 4.85, address: '12 rue de Lyon', city: 'Lyon' }
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const map = wrapper.findComponent({ name: 'TargetingMap' })
    if (map.exists()) {
      expect(map.props('defaultCenter')).toEqual([45.75, 4.85])
      expect(map.props('defaultZoom')).toBe(9)
    }
  })

  it('does not pass defaultCenter when shop has no coordinates', () => {
    mockPrimaryShop.value = null
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const map = wrapper.findComponent({ name: 'TargetingMap' })
    if (map.exists()) {
      expect(map.props('defaultCenter')).toBeUndefined()
    }
  })

  // === Dual mode tests (new) ===

  it('renders mode toggle', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-targeting-mode-toggle]').exists()).toBe(true)
  })

  it('shows classic mode label when in classic mode', () => {
    mockEffectiveMode.value = 'classic'
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-targeting-mode-toggle]').text()).toContain('wizard.targeting.modeToggle.classic')
  })

  it('shows smart mode label when in smart mode', () => {
    mockEffectiveMode.value = 'smart'
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-targeting-mode-toggle]').text()).toContain('wizard.targeting.modeToggle.smart')
  })

  it('shows SmartSearch in smart mode', () => {
    mockEffectiveMode.value = 'smart'
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-smart-search]').exists()).toBe(true)
    expect(wrapper.findAll('[data-method-card]')).toHaveLength(0)
  })

  it('shows method cards in classic mode, no SmartSearch', () => {
    mockEffectiveMode.value = 'classic'
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.findAll('[data-method-card]')).toHaveLength(3)
    expect(wrapper.find('[data-smart-search]').exists()).toBe(false)
  })

  it('hides selectors in smart mode', () => {
    mockEffectiveMode.value = 'smart'
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-department-selector]').exists()).toBe(false)
    expect(wrapper.find('[data-postcode-input]').exists()).toBe(false)
    expect(wrapper.find('[data-address-radius]').exists()).toBe(false)
  })

  it('map renders in both modes', () => {
    mockEffectiveMode.value = 'smart'
    const wrapper1 = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper1.find('[data-targeting-map]').exists()).toBe(true)

    mockEffectiveMode.value = 'classic'
    const wrapper2 = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper2.find('[data-targeting-map]').exists()).toBe(true)
  })

  it('SmartSearch select emits update store for department', async () => {
    mockEffectiveMode.value = 'smart'
    const wizard = useCampaignWizardStore()
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })

    const smartSearch = wrapper.findComponent({ name: 'SmartSearch' })
    if (smartSearch.exists()) {
      smartSearch.vm.$emit('select', { type: 'department', label: '75 — Paris', departmentCode: '75' })
      expect(wizard.campaign.targeting.method).toBe('department')
      expect(wizard.campaign.targeting.departments).toContain('75')
    }
  })

  it('SmartSearch select emits update store for address', async () => {
    mockEffectiveMode.value = 'smart'
    const wizard = useCampaignWizardStore()
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })

    const smartSearch = wrapper.findComponent({ name: 'SmartSearch' })
    if (smartSearch.exists()) {
      smartSearch.vm.$emit('select', { type: 'address', label: '12 rue de Lyon', lat: 45.75, lng: 4.85 })
      expect(wizard.campaign.targeting.method).toBe('address')
      expect(wizard.campaign.targeting.lat).toBe(45.75)
      expect(wizard.campaign.targeting.lng).toBe(4.85)
    }
  })

  it('calls detect on mount', () => {
    mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(mockDetect).toHaveBeenCalled()
  })
})
