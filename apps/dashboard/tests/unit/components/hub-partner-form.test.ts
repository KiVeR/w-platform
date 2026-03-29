import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, ref, watch } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'
import { stubAuthGlobals } from '../../helpers/auth-stubs'

stubAuthGlobals()
mockUseI18n()
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)

const PartnerForm = (await import('@/components/hub/PartnerForm.vue')).default

describe('PartnerForm', () => {
  it('renders in create mode with empty fields', () => {
    const wrapper = mount(PartnerForm, {
      props: { isSaving: false, mode: 'create' },
    })

    expect(wrapper.find('[data-partner-form]').exists()).toBe(true)
    expect(wrapper.find('[data-field-name]').exists()).toBe(true)
    expect(wrapper.find('[data-submit-btn]').exists()).toBe(true)
    expect(wrapper.find('[data-cancel-btn]').exists()).toBe(true)
  })

  it('renders in edit mode with initial data', () => {
    const wrapper = mount(PartnerForm, {
      props: {
        isSaving: false,
        mode: 'edit',
        initialData: {
          id: 42,
          name: 'Test Partner',
          code: 'TP-001',
          email: 'test@test.fr',
          is_active: true,
        },
      },
    })

    const nameInput = wrapper.find('[data-field-name]')
    expect(nameInput.exists()).toBe(true)
    expect((nameInput.element as HTMLInputElement).value).toBe('Test Partner')
  })

  it('emits submit with form data', async () => {
    const wrapper = mount(PartnerForm, {
      props: {
        isSaving: false,
        mode: 'create',
      },
    })

    await wrapper.find('[data-field-name]').setValue('New Partner')
    await wrapper.find('[data-partner-form]').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')![0][0]).toMatchObject({
      name: 'New Partner',
    })
  })

  it('emits cancel on cancel button click', async () => {
    const wrapper = mount(PartnerForm, {
      props: { isSaving: false, mode: 'create' },
    })

    await wrapper.find('[data-cancel-btn]').trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('disables submit button when saving', () => {
    const wrapper = mount(PartnerForm, {
      props: { isSaving: true, mode: 'create' },
    })

    const submitBtn = wrapper.find('[data-submit-btn]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('disables submit button when name is empty', () => {
    const wrapper = mount(PartnerForm, {
      props: { isSaving: false, mode: 'create' },
    })

    const submitBtn = wrapper.find('[data-submit-btn]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })
})
