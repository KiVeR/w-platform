import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'
import type { WizardStep } from '@/types/campaign'

stubAuthGlobals()
mockUseI18n()

const WizardStepper = (await import('@/components/campaigns/wizard/WizardStepper.vue')).default

const DummyIcon = { render: () => h('span', '✓') }

const slotStub = { template: '<div><slot /></div>' }

const fakeSteps: WizardStep[] = [
  { key: 'type', labelKey: 'wizard.steps.type', icon: DummyIcon },
  { key: 'message', labelKey: 'wizard.steps.message', icon: DummyIcon },
  { key: 'targeting', labelKey: 'wizard.steps.targeting', icon: DummyIcon },
  { key: 'landing-page', labelKey: 'wizard.steps.landingPage', icon: DummyIcon },
  { key: 'schedule', labelKey: 'wizard.steps.schedule', icon: DummyIcon },
  { key: 'review', labelKey: 'wizard.steps.review', icon: DummyIcon },
]

function mountStepper(currentStep: number, validation: boolean[]) {
  return mount(WizardStepper, {
    props: { steps: fakeSteps, currentStep, validation },
    global: {
      stubs: {
        TooltipProvider: slotStub,
        Tooltip: slotStub,
        TooltipTrigger: slotStub,
        TooltipContent: slotStub,
      },
    },
  })
}

describe('WizardStepper', () => {
  it('render toutes les étapes avec labels', () => {
    const wrapper = mountStepper(0, [false, false, false, false, false, false])

    const text = wrapper.text()
    expect(text).toContain('wizard.steps.type')
    expect(text).toContain('wizard.steps.message')
    expect(text).toContain('wizard.steps.targeting')
    expect(text).toContain('wizard.steps.landingPage')
    expect(text).toContain('wizard.steps.schedule')
    expect(text).toContain('wizard.steps.review')
  })

  it('étape courante highlighted', () => {
    const wrapper = mountStepper(2, [false, false, false, false, false, false])

    const steps = wrapper.findAll('[data-step]')
    expect(steps[2].classes()).toContain('step-current')
  })

  it('click étape passée émet step', async () => {
    const wrapper = mountStepper(2, [false, false, false, false, false, false])

    const steps = wrapper.findAll('[data-step]')
    await steps[0].trigger('click')

    expect(wrapper.emitted('step')).toBeTruthy()
    expect(wrapper.emitted('step')![0]).toEqual([0])
  })

  it('étapes futures non cliquables', async () => {
    const wrapper = mountStepper(2, [false, false, false, false, false, false])

    const steps = wrapper.findAll('[data-step]')
    await steps[4].trigger('click')

    expect(wrapper.emitted('step')).toBeFalsy()
  })

  it('step completed + valide → cercle success', () => {
    const wrapper = mountStepper(3, [true, true, false, false, false, false])

    const step0 = wrapper.find('[data-step="type"]')
    expect(step0.attributes('data-step-valid')).toBe('true')

    const circle = step0.find('span.rounded-full')
    expect(circle.classes()).toContain('bg-success-500')
  })

  it('step completed + invalide → cercle warning', () => {
    const wrapper = mountStepper(3, [true, false, true, false, false, false])

    const step1 = wrapper.find('[data-step="message"]')
    expect(step1.attributes('data-step-valid')).toBe('false')

    const circle = step1.find('span.rounded-full')
    expect(circle.classes()).toContain('bg-warning-500')
  })

  it('divider entre 2 steps valides → success', () => {
    const wrapper = mountStepper(3, [true, true, true, false, false, false])

    const dividers = wrapper.findAll('[data-divider]')
    // divider index 1 = between step 1 and step 2 (both completed & valid)
    expect(dividers[1].classes()).toContain('bg-success-500')
  })

  it('divider entre steps mixtes → warning', () => {
    const wrapper = mountStepper(3, [true, false, true, false, false, false])

    const dividers = wrapper.findAll('[data-divider]')
    // divider index 1 = between step 1 (invalid) and step 2 (valid)
    expect(dividers[1].classes()).toContain('bg-warning-500')
  })

  it('divider avant currentStep → primary', () => {
    const wrapper = mountStepper(2, [true, true, false, false, false, false])

    const dividers = wrapper.findAll('[data-divider]')
    // divider index 1 = between step 1 (completed) and step 2 (current)
    expect(dividers[1].classes()).toContain('bg-primary')
  })

  it('step courant n\'a pas d\'attribut valid', () => {
    const wrapper = mountStepper(1, [true, false, false, false, false, false])

    const step1 = wrapper.find('[data-step="message"]')
    expect(step1.attributes('data-step-valid')).toBeUndefined()
  })
})
