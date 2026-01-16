import { tokenRefreshManager } from '@/services/api/tokenRefreshManager'
import { useAuthStore } from '@/stores/auth'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  // Register failure handler for token refresh
  tokenRefreshManager.onRefreshFailure(() => {
    // Clear the Pinia store state
    const authStore = useAuthStore()
    authStore.clearAuth()

    // Redirect to login
    router.push('/login')
  })
})
