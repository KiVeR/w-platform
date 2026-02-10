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

const fakeSteps: WizardStep[] = [
  { key: 'type', labelKey: 'wizard.steps.type', icon: DummyIcon },
  { key: 'message', labelKey: 'wizard.steps.message', icon: DummyIcon },
  { key: 'targeting', labelKey: 'wizard.steps.targeting', icon: DummyIcon },
  { key: 'landing-page', labelKey: 'wizard.steps.landingPage', icon: DummyIcon },
  { key: 'schedule', labelKey: 'wizard.steps.schedule', icon: DummyIcon },
  { key: 'review', labelKey: 'wizard.steps.review', icon: DummyIcon },
]

describe('WizardStepper', () => {
  it('render toutes les étapes avec labels', () => {
    const wrapper = mount(WizardStepper, {
      props: {
        steps: fakeSteps,
        currentStep: 0,
        validation: [false, false, false, false, false, false],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('wizard.steps.type')
    expect(text).toContain('wizard.steps.message')
    expect(text).toContain('wizard.steps.targeting')
    expect(text).toContain('wizard.steps.landingPage')
    expect(text).toContain('wizard.steps.schedule')
    expect(text).toContain('wizard.steps.review')
  })

  it('étape courante highlighted', () => {
    const wrapper = mount(WizardStepper, {
      props: {
        steps: fakeSteps,
        currentStep: 2,
        validation: [false, false, false, false, false, false],
      },
    })

    const steps = wrapper.findAll('[data-step]')
    expect(steps[2].classes()).toContain('step-current')
  })

  it('click étape passée émet step', async () => {
    const wrapper = mount(WizardStepper, {
      props: {
        steps: fakeSteps,
        currentStep: 2,
        validation: [false, false, false, false, false, false],
      },
    })

    const steps = wrapper.findAll('[data-step]')
    await steps[0].trigger('click')

    expect(wrapper.emitted('step')).toBeTruthy()
    expect(wrapper.emitted('step')![0]).toEqual([0])
  })

  it('étapes futures non cliquables', async () => {
    const wrapper = mount(WizardStepper, {
      props: {
        steps: fakeSteps,
        currentStep: 2,
        validation: [false, false, false, false, false, false],
      },
    })

    const steps = wrapper.findAll('[data-step]')
    await steps[4].trigger('click')

    expect(wrapper.emitted('step')).toBeFalsy()
  })
})
