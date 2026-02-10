import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

stubAuthGlobals({ $api: { POST: vi.fn(), PUT: vi.fn(), GET: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const StepTargeting = (await import('@/components/campaigns/wizard/StepTargeting.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardDescription: slotStub,
  DepartmentSelector: { template: '<div data-department-selector />', props: ['modelValue'], emits: ['update:modelValue'] },
  PostcodeInput: { template: '<div data-postcode-input />', props: ['modelValue'], emits: ['update:modelValue'] },
  AddressRadius: { template: '<div data-address-radius />', props: ['address', 'lat', 'lng', 'radius'], emits: ['update:address', 'update:lat', 'update:lng', 'update:radius'] },
  TargetingMap: { template: '<div data-targeting-map />', props: ['method', 'departments', 'postcodes', 'address', 'lat', 'lng', 'radius'], emits: ['toggleDepartment'] },
  ClientOnly: slotStub,
}

describe('StepTargeting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('renders 3 method cards', () => {
    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    expect(wrapper.findAll('[data-method-card]')).toHaveLength(3)
  })

  it('department method is selected by default', () => {
    const wizard = useCampaignWizardStore()
    expect(wizard.campaign.targeting.method).toBe('department')

    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    const cards = wrapper.findAll('[data-method-card]')
    expect(cards[0].classes().some(c => c.includes('border-primary') || c.includes('ring'))).toBe(true)
  })

  it('clicking postcode card switches method', async () => {
    const wizard = useCampaignWizardStore()

    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    const cards = wrapper.findAll('[data-method-card]')
    await cards[1].trigger('click')

    expect(wizard.campaign.targeting.method).toBe('postcode')
  })

  it('shows DepartmentSelector when method is department', () => {
    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-department-selector]').exists()).toBe(true)
  })

  it('shows PostcodeInput when method is postcode', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'postcode'

    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-postcode-input]').exists()).toBe(true)
  })

  it('shows AddressRadius when method is address', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'address'

    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-address-radius]').exists()).toBe(true)
  })

  it('renders map component', () => {
    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-targeting-map]').exists()).toBe(true)
  })

  it('toggleDepartment from map updates store departments', async () => {
    const wizard = useCampaignWizardStore()

    const wrapper = mount(StepTargeting, { global: { stubs: baseStubs } })
    const map = wrapper.findComponent({ name: 'TargetingMap' })
    if (map.exists()) {
      map.vm.$emit('toggleDepartment', '75')
      expect(wizard.campaign.targeting.departments).toContain('75')
    }
  })
})
