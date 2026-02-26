import { describe, it, expect } from 'vitest'
import { createLruCache } from '@/utils/lru-cache'

describe('createLruCache', () => {
  it('stores and retrieves values', () => {
    const cache = createLruCache<string>(10)
    cache.set('a', 'hello')
    expect(cache.get('a')).toBe('hello')
  })

  it('returns undefined for missing keys', () => {
    const cache = createLruCache<string>(10)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('has() returns correct state', () => {
    const cache = createLruCache<number>(10)
    expect(cache.has('x')).toBe(false)
    cache.set('x', 42)
    expect(cache.has('x')).toBe(true)
  })

  it('evicts oldest entry when maxSize reached', () => {
    const cache = createLruCache<string>(2)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3') // should evict 'a'

    expect(cache.has('a')).toBe(false)
    expect(cache.get('b')).toBe('2')
    expect(cache.get('c')).toBe('3')
  })

  it('overwrites existing key without eviction', () => {
    const cache = createLruCache<string>(2)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('a', 'updated')

    expect(cache.get('a')).toBe('updated')
    expect(cache.get('b')).toBe('2')
  })
})
