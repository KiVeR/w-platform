import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../../helpers/stubs'
import { fakeUser, fakeAuthResponse } from '../../helpers/fixtures'

const mockApi = {
  POST: vi.fn(),
  GET: vi.fn(),
}

stubAuthGlobals({ $api: mockApi })
mockUseI18n()

const { useAuthStore } = await import('@/stores/auth')

const SettingsPage = (await import('@/pages/settings/index.vue')).default

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  function mountSettings() {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)

    return mount(SettingsPage, {
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })
  }

  it('displays user info (firstname, lastname, email)', () => {
    const wrapper = mountSettings()
    const inputs = wrapper.findAll('input')

    const values = inputs.map(i => i.element.value)
    expect(values).toContain(fakeUser.firstname)
    expect(values).toContain(fakeUser.lastname)
    expect(values).toContain(fakeUser.email)
  })

  it('displays role badge', () => {
    const wrapper = mountSettings()
    expect(wrapper.text()).toContain('partner')
  })
})
