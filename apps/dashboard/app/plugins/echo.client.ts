import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { tokenRefreshManager } from '@/services/tokenRefreshManager'

declare module '#app' {
  interface NuxtApp {
    $echo?: Echo<'pusher'>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $echo?: Echo<'pusher'>
  }
}

async function authorizeChannel(
  apiUrl: string,
  channelName: string,
  socketId: string,
): Promise<{ auth: string }> {
  const token = tokenRefreshManager.getAccessToken()
  if (!token) {
    throw new Error('missing_access_token')
  }

  const response = await fetch(`${apiUrl}/api/broadcasting/auth`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      socket_id: socketId,
      channel_name: channelName,
    }),
  })

  if (!response.ok) {
    throw new Error(`broadcast_auth_failed:${response.status}`)
  }

  return response.json() as Promise<{ auth: string }>
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const pusher = config.public.pusher

  if (pusher.enabled !== 'true' || !pusher.appKey) {
    return
  }

  Pusher.logToConsole = pusher.logToConsole === 'true'

  const echo = new Echo({
    broadcaster: 'pusher',
    Pusher,
    key: pusher.appKey,
    cluster: pusher.cluster || undefined,
    wsHost: pusher.host || undefined,
    httpHost: pusher.host || undefined,
    wsPort: pusher.port,
    wssPort: pusher.port,
    forceTLS: pusher.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
      authorize: async (socketId: string, callback: (error: Error | null, data?: { auth: string }) => void) => {
        try {
          const response = await authorizeChannel(config.public.apiUrl, channel.name, socketId)
          callback(null, response)
        }
        catch (error) {
          callback(error as Error)
        }
      },
    }),
  })

  return {
    provide: {
      echo,
    },
  }
})
