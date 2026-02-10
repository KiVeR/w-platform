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
const StepSchedule = (await import('@/components/campaigns/wizard/StepSchedule.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  CardDescription: slotStub,
  Button: { template: '<button><slot /></button>' },
  Popover: slotStub,
  PopoverTrigger: slotStub,
  PopoverContent: slotStub,
  Calendar: { template: '<div data-calendar />' },
  Select: slotStub,
  SelectTrigger: slotStub,
  SelectContent: slotStub,
  SelectItem: { template: '<div data-select-item><slot /></div>', props: ['value'] },
  SelectValue: { template: '<span />', props: ['placeholder'] },
  Alert: { template: '<div data-alert><slot /></div>' },
  AlertDescription: slotStub,
}

describe('StepSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('render mode sélection', () => {
    const wrapper = mount(StepSchedule, {
      global: { stubs: baseStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('wizard.schedule.sendNow')
    expect(text).toContain('wizard.schedule.scheduleLater')
  })

  it('mode "schedule" affiche date et time', async () => {
    const wizard = useCampaignWizardStore()
    wizard.scheduleMode = 'schedule'

    const wrapper = mount(StepSchedule, {
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-schedule-form]').exists()).toBe(true)
  })

  it('info fenêtre 8h-20h visible', () => {
    const wizard = useCampaignWizardStore()
    wizard.scheduleMode = 'schedule'

    const wrapper = mount(StepSchedule, {
      global: { stubs: baseStubs },
    })

    expect(wrapper.text()).toContain('wizard.schedule.windowInfo')
  })
})
