import type { UserPublic } from '#shared/types/user'
import type { PlatformUser } from '@/utils/userAdapter'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { STORAGE_KEYS, tokenRefreshManager } from '@/services/api/tokenRefreshManager'
import { platformUserToKreoUser } from '@/utils/userAdapter'

const USER_STORAGE_KEY = 'wellpack-user'

/** Response shape from POST /api/auth/login on platform-api */
interface PlatformLoginResponse {
  data: {
    access_token: string
    refresh_token: string
    user: PlatformUser
  }
}

/** Response shape from GET /api/auth/me on platform-api */
interface PlatformMeResponse {
  data: PlatformUser
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<UserPublic | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const accessToken = computed(() => tokenRefreshManager.getAccessToken())
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isEditor = computed(() => user.value?.role === 'EDITOR' || user.value?.role === 'ADMIN')
  const fullName = computed(() => {
    if (!user.value) return ''
    const parts = [user.value.firstName, user.value.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : user.value.email
  })

  // Actions

  function init() {
    if (import.meta.client) {
      const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const userJson = localStorage.getItem(USER_STORAGE_KEY)

      if (storedToken && userJson) {
        try {
          user.value = JSON.parse(userJson)
        }
        catch {
          clearAuth()
        }
      }
    }
  }

  function clearAuth() {
    user.value = null
    error.value = null
    tokenRefreshManager.clearTokens()
    if (import.meta.client) {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<PlatformLoginResponse>(
        `${config.public.platformApiUrl}/api/auth/login`,
        {
          method: 'POST',
          body: { email, password },
        },
      )

      tokenRefreshManager.saveTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      })

      user.value = platformUserToKreoUser(response.data.user)
      error.value = null

      if (import.meta.client) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.value))
      }

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

  async function logout(): Promise<void> {
    try {
      const config = useRuntimeConfig()
      const token = tokenRefreshManager.getAccessToken()
      await $fetch(`${config.public.platformApiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    }
    catch {
      // Ignore logout errors
    }
    finally {
      clearAuth()
    }
  }

  async function fetchMe(): Promise<boolean> {
    const token = tokenRefreshManager.getAccessToken()
    if (!token) {
      // Try to refresh first
      try {
        const newToken = await tokenRefreshManager.refreshToken()
        if (!newToken) {
          clearAuth()
          return false
        }
      }
      catch {
        clearAuth()
        return false
      }
    }

    try {
      const config = useRuntimeConfig()
      const currentToken = tokenRefreshManager.getAccessToken()
      const response = await $fetch<PlatformMeResponse>(
        `${config.public.platformApiUrl}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      )

      user.value = platformUserToKreoUser(response.data)
      if (import.meta.client) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.value))
      }
      return true
    }
    catch {
      // Try to refresh token
      try {
        const newToken = await tokenRefreshManager.refreshToken()
        if (newToken) {
          return fetchMe()
        }
      }
      catch {
        // refresh failed
      }
      clearAuth()
      return false
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    // Getters
    accessToken,
    isAuthenticated,
    isAdmin,
    isEditor,
    fullName,
    // Actions
    init,
    clearAuth,
    login,
    logout,
    fetchMe,
  }
})
