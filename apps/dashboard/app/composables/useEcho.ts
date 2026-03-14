import { computed, onBeforeUnmount } from 'vue'
import type Echo from 'laravel-echo'

export interface EchoListenerPayload {
  id?: number | string
}

export function useEcho() {
  const { $echo } = useNuxtApp() as { $echo?: Echo<'pusher'> }
  const trackedChannels = new Set<string>()
  const isEnabled = computed(() => !!$echo)

  function listen<T extends EchoListenerPayload>(
    channelName: string,
    event: string,
    callback: (payload: T) => void,
  ): void {
    if (!$echo) return

    $echo.private(channelName).listen(event, callback as never)
    trackedChannels.add(channelName)
  }

  function stopListening(channelName: string): void {
    if (!$echo) return

    $echo.leave(channelName)
    trackedChannels.delete(channelName)
  }

  onBeforeUnmount(() => {
    trackedChannels.forEach(stopListening)
  })

  return {
    isEnabled,
    listen,
    stopListening,
  }
}
