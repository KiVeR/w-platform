import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../../helpers/stubs'

const mockApi = {
  POST: vi.fn(),
  GET: vi.fn(),
}

stubAuthGlobals({ $api: mockApi })
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('navigateTo', vi.fn())
mockUseI18n()

const { useAuthStore } = await import('@/stores/auth')

const LoginPage = (await import('@/pages/login.vue')).default

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  function mountLogin() {
    return mount(LoginPage, {
      global: {
        stubs: {
          AppLogo: { template: '<div />' },
          NuxtLink: NuxtLinkStub,
        },
      },
    })
  }

  it('renders email and password fields', () => {
    const wrapper = mountLogin()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('shows validation errors on empty submit', async () => {
    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    // Wait for vee-validate async validation to render
    await new Promise(r => setTimeout(r, 10))
    await flushPromises()

    const messages = wrapper.findAll('[data-slot="form-message"]')
    expect(messages.length).toBeGreaterThanOrEqual(1)
  })

  it('calls auth.login with form values', async () => {
    const wrapper = mountLogin()
    const auth = useAuthStore()
    const loginSpy = vi.spyOn(auth, 'login').mockResolvedValue()

    const emailInput = wrapper.find('input[type="email"]')
    const passwordInput = wrapper.find('input[type="password"]')

    await emailInput.setValue('jean@test.com')
    await emailInput.trigger('change')
    await passwordInput.setValue('password123')
    await passwordInput.trigger('change')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    // Wait for vee-validate async validation
    await new Promise(r => setTimeout(r, 10))
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith('jean@test.com', 'password123')
  })

  it('shows destructive alert when auth.error is set', async () => {
    const wrapper = mountLogin()
    const auth = useAuthStore()
    auth.error = 'Invalid credentials.'
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid credentials.')
  })

  it('disables submit button and shows spinner when loading', async () => {
    const wrapper = mountLogin()
    const auth = useAuthStore()
    auth.isLoading = true
    await flushPromises()

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('login.submitting')
  })

  it('toggles password visibility on eye icon click', async () => {
    const wrapper = mountLogin()
    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)

    const toggleBtn = wrapper.find('button[type="button"][aria-label]')
    await toggleBtn.trigger('click')
    await flushPromises()

    // After toggle, input should be type="text"
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })
})
