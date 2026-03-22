export function createLruCache<V>(maxSize: number) {
  const cache = new Map<string, V>()

  return {
    get: (key: string) => cache.get(key),
    set(key: string, value: V) {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value
        if (firstKey !== undefined) cache.delete(firstKey)
      }
      cache.set(key, value)
    },
    has: (key: string) => cache.has(key),
  }
}
