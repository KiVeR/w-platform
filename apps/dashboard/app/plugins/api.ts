import createClient from 'openapi-fetch'
import type { paths } from '@/types/api'
import { tokenRefreshManager } from '@/services/tokenRefreshManager'
import { createAuthMiddleware } from '@/services/apiMiddleware'
import { useAuthStore } from '@/stores/auth'

export default defineNuxtPlugin({
  name: 'api',
  setup() {
    const pinia = usePinia()
    const config = useRuntimeConfig()
    const router = useRouter()
    const auth = useAuthStore(pinia)

    const client = createClient<paths>({
      baseUrl: `${config.public.apiUrl}/api`,
    })

    function handleAuthFailure() {
      auth.clearAuth()
      router.push('/login')
    }

    const middleware = createAuthMiddleware(
      () => tokenRefreshManager.getAccessToken(),
      () => tokenRefreshManager.refreshToken(),
      handleAuthFailure,
    )

    client.use(middleware)

    tokenRefreshManager.onRefreshFailure(handleAuthFailure)

    return { provide: { api: client } }
  },
})
