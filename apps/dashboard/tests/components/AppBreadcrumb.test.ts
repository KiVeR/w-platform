import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { NuxtLinkStub, mockUseI18n } from '../helpers/stubs'

const mockRoute = {
  path: '/',
  meta: {},
}

vi.stubGlobal('computed', computed)
vi.stubGlobal('useRoute', () => mockRoute)
mockUseI18n()

const AppBreadcrumb = (await import('@/components/layout/AppBreadcrumb.vue')).default

const slotStub = { template: '<div><slot /></div>' }

describe('AppBreadcrumb', () => {
  beforeEach(() => {
    mockRoute.path = '/'
    mockRoute.meta = {}
  })

  function mountBreadcrumb() {
    return mount(AppBreadcrumb, {
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
          Breadcrumb: slotStub,
          BreadcrumbItem: slotStub,
          BreadcrumbLink: slotStub,
          BreadcrumbList: slotStub,
          BreadcrumbPage: slotStub,
          BreadcrumbSeparator: slotStub,
        },
      },
    })
  }

  it('renders dashboard breadcrumb on root route', () => {
    const wrapper = mountBreadcrumb()
    expect(wrapper.text()).toContain('breadcrumb.dashboard')
  })

  it('renders admin breadcrumb segments for variable schemas page', () => {
    mockRoute.path = '/admin/variable-schemas'

    const wrapper = mountBreadcrumb()

    expect(wrapper.text()).toContain('breadcrumb.dashboard')
    expect(wrapper.text()).toContain('breadcrumb.admin')
    expect(wrapper.text()).toContain('breadcrumb.variableSchemas')
  })
})
