import { useAuthStore } from '@/stores/auth'

const publicRoutes = ['/login']

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore(usePinia())

  if (!auth.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (auth.isAuthenticated && publicRoutes.includes(to.path)) {
    return navigateTo('/')
  }
})
