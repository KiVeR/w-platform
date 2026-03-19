import type { H3Event } from 'h3'

let cachedToken: { accessToken: string, expiresAt: number } | null = null

async function getAccessToken(baseUrl: string, clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000)
    return cachedToken.accessToken

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

export async function platformApiFetch<T>(
  event: H3Event,
  path: string,
  options: { method?: string, body?: unknown } = {},
): Promise<T> {
  const config = useRuntimeConfig(event)
  const baseUrl = config.platformApiUrl as string
  const clientId = config.platformApiClientId as string
  const clientSecret = config.platformApiClientSecret as string

  if (!baseUrl || !clientId || !clientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Platform API not configured',
    })
  }

  const token = await getAccessToken(baseUrl, clientId, clientSecret)
  const url = `${baseUrl}${path}`

  return $fetch<T>(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}
