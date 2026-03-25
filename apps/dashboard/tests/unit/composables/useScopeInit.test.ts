import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser, fakePartner } from '../../helpers/fixtures'

const mockApi = {
  GET: vi.fn(),
}
stubAuthGlobals({ $api: mockApi })

let mockRoute = { path: '/', params: {} as Record<string, string> }
vi.stubGlobal('useRoute', () => mockRoute)

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)

const onMountedCallbacks: (() => void | Promise<void>)[] = []
vi.stubGlobal('onMounted', (cb: () => void | Promise<void>) => { onMountedCallbacks.push(cb) })

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')
const { useScopeInit } = await import('@/composables/useScopeInit')

describe('useScopeInit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    onMountedCallbacks.length = 0
    setActivePinia(createPinia())
    mockRoute = { path: '/', params: {} }
  })

  function setupAdmin() {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
    return { auth, partner: usePartnerStore() }
  }

  it('returns ready=false initially', () => {
    setupAdmin()
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

    const { ready } = useScopeInit()
    expect(ready.value).toBe(false)
  })

  it('sets ready=true after successful mount', async () => {
    setupAdmin()
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

    mockApi.GET.mockResolvedValue({
      data: { data: fakePartner },
    })

    const { ready } = useScopeInit()
    expect(onMountedCallbacks.length).toBe(1)

    await onMountedCallbacks[0]()

    expect(ready.value).toBe(true)
  })

  it('calls fetchPartnerInfo and setPartner with correct id', async () => {
    const { partner } = setupAdmin()
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

    mockApi.GET.mockResolvedValue({
      data: { data: fakePartner },
    })

    useScopeInit()
    await onMountedCallbacks[0]()

    expect(partner.currentPartnerId).toBe(42)
    expect(partner.currentPartnerName).toBe('Test Partner')
  })

  it('navigates to hub when partnerId is NaN', async () => {
    setupAdmin()
    mockRoute = { path: '/partners/abc/dashboard', params: { id: 'abc' } }

    useScopeInit()
    await onMountedCallbacks[0]()

    expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
  })

  it('exposes partnerId as computed', () => {
    setupAdmin()
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

    const { partnerId } = useScopeInit()
    expect(partnerId.value).toBe(42)
  })
})
