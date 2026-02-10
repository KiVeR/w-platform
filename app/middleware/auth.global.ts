import { useAuthStore } from '@/stores/auth'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register']

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server side
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()

  // Initialize auth from localStorage
  authStore.init()

  // Allow public routes
  if (publicRoutes.includes(to.path)) {
    // Redirect to dashboard if already authenticated
    if (authStore.isAuthenticated) {
      return navigateTo('/dashboard')
    }
    return
  }

  // Check if authenticated
  if (!authStore.isAuthenticated) {
    // Try to fetch user with existing token
    const success = await authStore.fetchUser()
    if (!success) {
      return navigateTo('/login')
    }
  }
})
