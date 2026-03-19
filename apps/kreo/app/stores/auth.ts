import type { LoginResponse, RefreshResponse } from '#shared/types/api'
import type { UserPublic } from '#shared/types/user'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<UserPublic | null>(null)
  const accessToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isEditor = computed(() => user.value?.role === 'EDITOR' || user.value?.role === 'ADMIN')
  const fullName = computed(() => {
    if (!user.value)
      return ''
    const parts = [user.value.firstName, user.value.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : user.value.email
  })

  // Actions

  // Initialize from localStorage on app start
  // Note: refreshToken is now in HttpOnly cookie, not accessible from JS
  function init() {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('accessToken')
      const userJson = localStorage.getItem('user')

      if (storedToken && userJson) {
        accessToken.value = storedToken
        try {
          user.value = JSON.parse(userJson)
        }
        catch {
          clearAuth()
        }
      }
    }
  }

  // Store tokens and user
  // Note: refreshToken is set as HttpOnly cookie by server
  function setAuth(data: LoginResponse) {
    accessToken.value = data.accessToken
    user.value = data.user
    error.value = null

    if (import.meta.client) {
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
  }

  // Update tokens after refresh
  // Note: refreshToken is set as HttpOnly cookie by server
  function updateTokens(data: RefreshResponse) {
    accessToken.value = data.accessToken

    if (import.meta.client) {
      localStorage.setItem('accessToken', data.accessToken)
    }
  }

  // Clear all auth data
  function clearAuth() {
    user.value = null
    accessToken.value = null
    error.value = null

    if (import.meta.client) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
    }
  }

  // Login
  async function login(email: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      })

      setAuth(data)
      return true
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { message?: string } }
      error.value = fetchError.data?.message || 'Erreur de connexion'
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  // Register
  async function register(data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<LoginResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: data,
        credentials: 'include',
      })

      setAuth(response)
      return true
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { message?: string } }
      error.value = fetchError.data?.message || 'Erreur d\'inscription'
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  // Logout
  // Note: Server reads refreshToken from HttpOnly cookie
  async function logout(): Promise<void> {
    try {
      await $fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    }
    catch {
      // Ignore logout errors
    }
    finally {
      clearAuth()
    }
  }

  // Refresh tokens
  // Note: Server reads refreshToken from HttpOnly cookie
  async function refresh(): Promise<boolean> {
    try {
      const data = await $fetch<RefreshResponse>('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      updateTokens(data)
      return true
    }
    catch {
      clearAuth()
      return false
    }
  }

  // Fetch current user
  async function fetchUser(): Promise<boolean> {
    if (!accessToken.value) {
      // Try to refresh first (cookie may be present)
      const refreshed = await refresh()
      if (!refreshed) {
        return false
      }
    }

    try {
      const userData = await $fetch<UserPublic>('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
        credentials: 'include',
      })

      user.value = userData
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(userData))
      }
      return true
    }
    catch {
      // Try to refresh token
      const refreshed = await refresh()
      if (refreshed) {
        return fetchUser()
      }
      clearAuth()
      return false
    }
  }

  return {
    // State
    user,
    accessToken,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    isEditor,
    fullName,
    // Actions
    init,
    setAuth,
    updateTokens,
    clearAuth,
    login,
    register,
    logout,
    refresh,
    fetchUser,
  }
})
