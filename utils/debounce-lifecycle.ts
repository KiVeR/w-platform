import { onScopeDispose } from 'vue'

export function createDebouncedFetcher(delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let controller: AbortController | null = null

  function cancel() {
    if (timer) clearTimeout(timer)
    if (controller) controller.abort()
  }

  function schedule(fn: (signal: AbortSignal) => Promise<void>) {
    cancel()
    timer = setTimeout(async () => {
      controller = new AbortController()
      try {
        await fn(controller.signal)
      }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        throw err
      }
    }, delay)
  }

  onScopeDispose(cancel)

  return { schedule, cancel }
}
