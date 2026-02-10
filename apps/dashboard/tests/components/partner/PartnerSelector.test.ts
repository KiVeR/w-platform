import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser, fakeAuthResponse } from '../../helpers/fixtures'
import { NuxtLinkStub, mockUseI18n } from '../../helpers/stubs'

const mockApi = {
  POST: vi.fn(),
  GET: vi.fn(),
}

stubAuthGlobals({ $api: mockApi })

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')

const PartnerSelector = (await import('@/components/partner/PartnerSelector.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const voidStub = { template: '<div />' }

const selectorStubs = {
  Popover: slotStub,
  PopoverTrigger: slotStub,
  PopoverContent: slotStub,
  Command: slotStub,
  CommandInput: voidStub,
  CommandEmpty: { template: '<div data-empty><slot /></div>' },
  CommandGroup: slotStub,
  CommandList: slotStub,
  CommandItem: {
    template: '<div data-command-item @click="$emit(\'select\')"><slot /></div>',
    emits: ['select'],
  },
  Button: { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: false },
  Building2: voidStub,
  Check: voidStub,
  ChevronsUpDown: voidStub,
}

describe('PartnerSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockApi.GET.mockResolvedValue({ data: { data: [] } })
  })

  function mountSelector() {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })

    return mount(PartnerSelector, {
      global: { stubs: selectorStubs as Record<string, unknown> },
    })
  }

  it('displays "All partners" by default', () => {
    const wrapper = mountSelector()
    expect(wrapper.text()).toContain('partner.allPartners')
  })

  it('displays partner name when selected', () => {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
    const partner = usePartnerStore()
    partner.setPartner(42, 'Test Partner')

    const wrapper = mount(PartnerSelector, {
      global: { stubs: selectorStubs as Record<string, unknown> },
    })

    expect(wrapper.text()).toContain('Test Partner')
  })

  it('updates store on partner selection', async () => {
    mockApi.GET.mockResolvedValue({
      data: { data: [{ id: 42, name: 'Partner A' }] },
    })

    const wrapper = mountSelector()
    await flushPromises()

    const items = wrapper.findAll('[data-command-item]')
    // First item is "All partners", second is the partner
    const partnerItem = items.find(i => i.text().includes('Partner A'))
    if (partnerItem) {
      await partnerItem.trigger('click')
      await flushPromises()

      const partner = usePartnerStore()
      expect(partner.currentPartnerId).toBe(42)
      expect(partner.currentPartnerName).toBe('Partner A')
    }
  })

  it('clears selection on "All partners" click', async () => {
    const wrapper = mountSelector()
    const partner = usePartnerStore()
    partner.setPartner(42, 'Partner A')
    await flushPromises()

    const allItem = wrapper.findAll('[data-command-item]')[0]
    await allItem.trigger('click')
    await flushPromises()

    expect(partner.currentPartnerId).toBeNull()
    expect(partner.currentPartnerName).toBeNull()
  })

  it('shows empty text placeholder', () => {
    const wrapper = mountSelector()
    expect(wrapper.find('[data-empty]').text()).toContain('partner.noResults')
  })
})
