import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

const mockPost = vi.fn()
stubAuthGlobals({ $api: { POST: mockPost, PUT: vi.fn(), GET: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('isForbiddenMessage', (msg: string) => msg.toLowerCase().includes('rsms.co'))
mockUseI18n()

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 42,
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
  Button: { template: '<button data-button @click="$emit(\'click\')"><slot /></button>', emits: ['click'], props: ['disabled'] },
  DepartmentSelector: { template: '<div data-department-selector />', props: ['modelValue'], emits: ['update:modelValue'] },
  PostcodeInput: { template: '<div data-postcode-input />', props: ['modelValue'], emits: ['update:modelValue'] },
  AddressRadius: { template: '<div data-address-radius />', props: ['address', 'lat', 'lng', 'radius'], emits: ['update:address', 'update:lat', 'update:lng', 'update:radius'] },
  TargetingMap: { template: '<div data-targeting-map />', props: ['method', 'departments', 'postcodes', 'address', 'lat', 'lng', 'radius'], emits: ['toggleDepartment'] },
  DemographicsSelector: { template: '<div data-demographics-selector />', props: ['modelValue'], emits: ['update:modelValue'] },
  Separator: { template: '<hr data-separator />' },
  ClientOnly: slotStub,
}

describe('StepEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('renders 3 method cards', () => {
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

  it('renders DemographicsSelector after geo section', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })

    expect(wrapper.find('[data-separator]').exists()).toBe(true)
    expect(wrapper.find('[data-demographics-selector]').exists()).toBe(true)
  })

  it('shows count button when no estimate', () => {
    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-count-button]').exists()).toBe(true)
    expect(wrapper.find('[data-estimate-result]').exists()).toBe(false)
  })

  it('calls requestEstimate on count button click', async () => {
    mockPost.mockResolvedValue({
      data: { data: { volume: '5000', unit_price: '0.045', total_price: '225.00', sms_count: '1' } },
      error: null,
    })

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    await wrapper.find('[data-count-button]').trigger('click')
    await vi.dynamicImportSettled()

    expect(mockPost).toHaveBeenCalledWith('/estimate', expect.anything())
  })

  it('shows estimate result card when estimate exists', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 5000, unitPrice: 0.045, totalPrice: 225, smsCount: 1 }

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-estimate-result]').exists()).toBe(true)
    expect(wrapper.find('[data-count-button]').exists()).toBe(false)
  })

  it('displays volume in estimate result', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 5000, unitPrice: 0.045, totalPrice: 225, smsCount: 1 }

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-volume]').text()).toContain('5')
  })

  it('displays sms count in estimate result', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 5000, unitPrice: 0.045, totalPrice: 225, smsCount: 2 }

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-sms-count]').text()).toContain('2')
  })

  it('shows recalculate button when estimate exists', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 5000, unitPrice: 0.045, totalPrice: 225, smsCount: 1 }

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-recalculate-button]').exists()).toBe(true)
  })

  it('does not display pricing (volume only)', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 5000, unitPrice: 0.045, totalPrice: 225, smsCount: 1 }

    const wrapper = mount(StepEstimate, { global: { stubs: baseStubs } })
    const text = wrapper.text()
    expect(text).not.toContain('225')
    expect(text).not.toContain('0.045')
  })
})
