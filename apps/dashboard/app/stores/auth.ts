import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { tokenRefreshManager } from '@/services/tokenRefreshManager'
import type { AuthUser, Role, Permission } from '@/types/auth'

/**
 * Role priority — lower number = higher priority.
 * Used to pick the "primary" role when a user has multiple roles.
 */
const ROLE_PRIORITY: Record<Role, number> = {
  admin: 0,
  adv: 1,
  direction: 2,
  programmer: 3,
  commercial: 4,
  marketing_manager: 5,
  graphiste: 6,
  partner: 7,
  merchant: 8,
  employee: 9,
}

/**
 * Roles that are bound to a single partner — always in scope mode, no Hub access.
 */
const PARTNER_BOUND_ROLES: Role[] = ['partner', 'merchant', 'employee']

/**
 * Default redirect route after login, per primary role.
 * Internal roles (admin, adv, direction, etc.) land on Hub dashboard.
 * Partner-bound roles land directly on their campaigns page.
 */
const ROLE_DEFAULT_ROUTES: Partial<Record<Role, string>> = {
  admin: '/hub/dashboard',
  adv: '/hub/dashboard',
  direction: '/hub/dashboard',
  programmer: '/hub/dashboard',
  commercial: '/hub/dashboard',
  graphiste: '/hub/dashboard',
  marketing_manager: '/hub/dashboard',
  partner: '/campaigns',
  merchant: '/campaigns',
  employee: '/campaigns',
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  user: unknown
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!tokenRefreshManager.getAccessToken())
  const fullName = computed(() => user.value?.full_name ?? '')
  const initials = computed(() => {
    if (!user.value) return ''
    const first = user.value.firstname?.[0] ?? ''
    const last = user.value.lastname?.[0] ?? ''
    return `${first}${last}`.toUpperCase()
  })
  const primaryRole = computed<Role | null>(() =>
    user.value?.roles?.slice().sort(
      (a, b) => (ROLE_PRIORITY[a] ?? 99) - (ROLE_PRIORITY[b] ?? 99),
    )[0] ?? null,
  )
  // Alias kept for backward compatibility
  const role = computed<Role | null>(() => primaryRole.value)
  const partnerId = computed(() => user.value?.partner_id ?? null)
  const isAdmin = computed(() => primaryRole.value === 'admin')
  const defaultRoute = computed<string>(() =>
    ROLE_DEFAULT_ROUTES[primaryRole.value ?? 'employee'] ?? '/',
  )

  const isPartnerBound = computed(() =>
    primaryRole.value !== null && PARTNER_BOUND_ROLES.includes(primaryRole.value),
  )

  function hasRole(role: Role): boolean {
    return user.value?.roles?.includes(role) ?? false
  }

  function hasPermission(permission: Permission): boolean {
    return user.value?.permissions.includes(permission) ?? false
  }

  function setAuth(data: LoginResponse) {
    tokenRefreshManager.saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    user.value = data.user as AuthUser
    error.value = null
  }

  function clearAuth() {
    tokenRefreshManager.clearTokens()
    localStorage.removeItem('wellpack-partner-context')
    user.value = null
    error.value = null
  }

  async function performLogin(
    apiCall: () => Promise<{ data?: any; error?: any }>,
    fallbackError: string,
  ) {
    isLoading.value = true
    error.value = null
    try {
      const { data: result, error: apiError } = await apiCall()
      if (apiError) {
        error.value = (apiError as { message?: string }).message ?? fallbackError
        return
      }
      setAuth(result!.data as LoginResponse)
    } catch {
      error.value = fallbackError
    } finally {
      isLoading.value = false
    }
  }

  async function login(email: string, password: string) {
    const api = useNuxtApp().$api
    await performLogin(
      () => api.POST('/auth/login', { body: { email, password } }),
      'Login failed',
    )
  }

  async function loginWithGoogle(idToken: string) {
    const api = useNuxtApp().$api
    await performLogin(
      () => api.POST('/auth/social/login', { body: { provider: 'google', token: idToken } }),
      'Google login failed',
    )
  }

  async function fetchMe() {
    try {
      const api = useNuxtApp().$api
      const { data: result, error: apiError } = await api.GET('/auth/me')
      if (apiError) {
        clearAuth()
        return
      }
      user.value = result!.data as unknown as AuthUser
    } catch {
      clearAuth()
    }
  }

  async function logout() {
    try {
      const api = useNuxtApp().$api
      await api.POST('/auth/logout')
    } finally {
      clearAuth()
    }
  }

  async function init() {
    const token = tokenRefreshManager.getAccessToken()
    if (token) {
      await fetchMe()
    }
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    fullName,
    initials,
    role,
    primaryRole,
    partnerId,
    isAdmin,
    isPartnerBound,
    defaultRoute,
    hasRole,
    hasPermission,
    setAuth,
    clearAuth,
    login,
    loginWithGoogle,
    fetchMe,
    logout,
    init,
  }
})
