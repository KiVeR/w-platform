import { describe, expect, it } from 'vitest'
import {
  restoreVersionSchema,
  versionListQuerySchema,
} from '~~/shared/schemas/version.schema'

describe('versionListQuerySchema', () => {
  it('accepts valid query params', () => {
    const query = { page: '1', limit: '10', sortOrder: 'desc' }
    const result = versionListQuerySchema.parse(query)

    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.sortOrder).toBe('desc')
  })

  it('applies default values', () => {
    const result = versionListQuerySchema.parse({})

    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.sortOrder).toBe('desc')
  })

  it('coerces string numbers', () => {
    const result = versionListQuerySchema.parse({ page: '5', limit: '20' })

    expect(result.page).toBe(5)
    expect(result.limit).toBe(20)
  })

  it('accepts asc sortOrder', () => {
    const result = versionListQuerySchema.parse({ sortOrder: 'asc' })
    expect(result.sortOrder).toBe('asc')
  })

  it('rejects invalid sortOrder', () => {
    expect(() => versionListQuerySchema.parse({ sortOrder: 'invalid' })).toThrow()
  })

  it('rejects limit greater than 50', () => {
    expect(() => versionListQuerySchema.parse({ limit: '100' })).toThrow()
  })

  it('rejects negative page', () => {
    expect(() => versionListQuerySchema.parse({ page: '-1' })).toThrow()
  })

  it('rejects zero page', () => {
    expect(() => versionListQuerySchema.parse({ page: '0' })).toThrow()
  })
})

describe('restoreVersionSchema', () => {
  it('accepts valid restore input', () => {
    const input = { fromVersionId: 123 }
    const result = restoreVersionSchema.parse(input)

    expect(result.fromVersionId).toBe(123)
    expect(result.comment).toBeUndefined()
  })

  it('accepts restore input with comment', () => {
    const input = { fromVersionId: 456, comment: 'Reverting to previous design' }
    const result = restoreVersionSchema.parse(input)

    expect(result.fromVersionId).toBe(456)
    expect(result.comment).toBe('Reverting to previous design')
  })

  it('rejects missing fromVersionId', () => {
    expect(() => restoreVersionSchema.parse({})).toThrow()
  })

  it('rejects negative fromVersionId', () => {
    expect(() => restoreVersionSchema.parse({ fromVersionId: -1 })).toThrow()
  })

  it('rejects zero fromVersionId', () => {
    expect(() => restoreVersionSchema.parse({ fromVersionId: 0 })).toThrow()
  })

  it('rejects non-integer fromVersionId', () => {
    expect(() => restoreVersionSchema.parse({ fromVersionId: 1.5 })).toThrow()
  })

  it('rejects comment longer than 500 characters', () => {
    const longComment = 'a'.repeat(501)
    expect(() => restoreVersionSchema.parse({
      fromVersionId: 1,
      comment: longComment,
    })).toThrow()
  })

  it('accepts comment of exactly 500 characters', () => {
    const maxComment = 'a'.repeat(500)
    const result = restoreVersionSchema.parse({
      fromVersionId: 1,
      comment: maxComment,
    })
    expect(result.comment).toBe(maxComment)
  })
})
