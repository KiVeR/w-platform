import type { H3Event } from 'h3'

/**
 * In-memory cache for the OAuth access token.
 * Shared across all requests within the same Nitro process.
 */
let cachedToken: { accessToken: string, expiresAt: number } | null = null

/**
 * Obtain an OAuth2 access token from trigger-api using client_credentials grant.
 * Tokens are cached in memory and refreshed 60s before expiry.
 */
async function getAccessToken(baseUrl: string, clientId: string, clientSecret: string): Promise<string> {
  // Return cached token if still valid (with 60s safety margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken
  }

  const response = await $fetch<{
    access_token: string
    token_type: string
    expires_in: number
  }>(`${baseUrl}/oauth/token`, {
    method: 'POST',
    body: {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    },
  })

  cachedToken = {
    accessToken: response.access_token,
    expiresAt: Date.now() + response.expires_in * 1000,
  }

  return cachedToken.accessToken
}

/**
 * Helper for making authenticated requests to the trigger-api service.
 * Uses OAuth2 client_credentials grant (M2M) — never exposed to the browser.
 */
export async function triggerApiFetch<T>(
  event: H3Event,
  path: string,
  options: { method?: string, body?: unknown } = {},
): Promise<T> {
  const config = useRuntimeConfig(event)
  const baseUrl = config.triggerApiUrl as string
  const clientId = config.triggerApiClientId as string
  const clientSecret = config.triggerApiClientSecret as string

  if (!baseUrl || !clientId || !clientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Trigger API not configured',
    })
  }

  const token = await getAccessToken(baseUrl, clientId, clientSecret)
  const url = `${baseUrl}${path}`

  const response = await $fetch<T>(url, {
    method: (options.method as any) || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  return response
}
