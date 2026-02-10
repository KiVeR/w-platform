import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { tokenRefreshManager } from '@/services/tokenRefreshManager'
import type { AuthUser, Role } from '@/types/auth'

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
  const role = computed<Role | null>(() => user.value?.roles?.[0] ?? null)
  const partnerId = computed(() => user.value?.partner_id ?? null)
  const isAdmin = computed(() => role.value === 'admin')

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
    partnerId,
    isAdmin,
    setAuth,
    clearAuth,
    login,
    loginWithGoogle,
    fetchMe,
    logout,
    init,
  }
})
