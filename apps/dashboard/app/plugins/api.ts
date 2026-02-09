import createClient from 'openapi-fetch'
import type { paths } from '@/types/api'
import { tokenRefreshManager } from '@/services/tokenRefreshManager'
import { createAuthMiddleware } from '@/services/apiMiddleware'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const router = useRouter()

  const client = createClient<paths>({
    baseUrl: `${config.public.apiUrl}/api`,
  })

  const middleware = createAuthMiddleware(
    () => tokenRefreshManager.getAccessToken(),
    () => tokenRefreshManager.refreshToken(),
    () => router.push('/login'),
  )

  client.use(middleware)

  tokenRefreshManager.onRefreshFailure(() => {
    router.push('/login')
  })

  return { provide: { api: client } }
})
