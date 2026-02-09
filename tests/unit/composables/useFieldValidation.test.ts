import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref, watch } from 'vue'

function stubVueGlobals() {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
}

// Stub before dynamic import so module evaluation works
stubVueGlobals()

const mockGetContentSchemaForWidget = vi.fn()
const mockGetContentValidationErrors = vi.fn()

vi.mock('~~/shared/schemas/widgets', () => ({
  getContentSchemaForWidget: (...args: unknown[]) => mockGetContentSchemaForWidget(...args),
  getContentValidationErrors: (...args: unknown[]) => mockGetContentValidationErrors(...args),
}))

const { useFieldValidation, useWidgetValidation } = await import('#editor/composables/useFieldValidation')

// Re-stub before each test since unstubGlobals: true restores globals after each test
beforeAll(() => {
  stubVueGlobals()
})

beforeEach(() => {
  stubVueGlobals()
})

describe('useFieldValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validate', () => {
    it('returns true when no schema exists for widget type', () => {
      mockGetContentSchemaForWidget.mockReturnValue(undefined)

      const { validate, error } = useFieldValidation('title', 'text')
      const result = validate('Hello')

      expect(result).toBe(true)
      expect(error.value).toBeNull()
    })

    it('returns true when safeParse succeeds', () => {
      const mockSchema = {
        safeParse: vi.fn().mockReturnValue({ success: true, data: { text: 'Hello' } }),
      }
      mockGetContentSchemaForWidget.mockReturnValue(mockSchema)

      const { validate, error } = useFieldValidation('title', 'text')
      const result = validate('Hello')

      expect(result).toBe(true)
      expect(error.value).toBeNull()
      expect(mockSchema.safeParse).toHaveBeenCalledWith({ text: 'Hello' })
    })

    it('sets error when safeParse fails with matching field', () => {
      const mockSchema = {
        safeParse: vi.fn().mockReturnValue({
          success: false,
          error: {
            issues: [
              { path: ['text'], message: 'Text is required' },
            ],
          },
        }),
      }
      mockGetContentSchemaForWidget.mockReturnValue(mockSchema)

      const { validate, error } = useFieldValidation('title', 'text')
      const result = validate('')

      expect(result).toBe(false)
      expect(error.value).toBe('Text is required')
    })

    it('returns true when safeParse fails but no matching field error', () => {
      const mockSchema = {
        safeParse: vi.fn().mockReturnValue({
          success: false,
          error: {
            issues: [
              { path: ['otherField'], message: 'Other field error' },
            ],
          },
        }),
      }
      mockGetContentSchemaForWidget.mockReturnValue(mockSchema)

      const { validate, error } = useFieldValidation('title', 'text')
      const result = validate('Hello')

      expect(result).toBe(true)
      expect(error.value).toBeNull()
    })
  })

  describe('touch', () => {
    it('sets touched to true', () => {
      mockGetContentSchemaForWidget.mockReturnValue(undefined)

      const { touch, touched } = useFieldValidation('title', 'text')
      expect(touched.value).toBe(false)

      touch()
      expect(touched.value).toBe(true)
    })
  })

  describe('reset', () => {
    it('clears error and touched state', () => {
      const mockSchema = {
        safeParse: vi.fn().mockReturnValue({
          success: false,
          error: {
            issues: [
              { path: ['text'], message: 'Required' },
            ],
          },
        }),
      }
      mockGetContentSchemaForWidget.mockReturnValue(mockSchema)

      const { validate, touch, reset, error, touched } = useFieldValidation('title', 'text')
      validate('')
      touch()
      expect(error.value).toBe('Required')
      expect(touched.value).toBe(true)

      reset()
      expect(error.value).toBeNull()
      expect(touched.value).toBe(false)
    })
  })

  describe('widget type handling', () => {
    it('works with string widgetType', () => {
      mockGetContentSchemaForWidget.mockReturnValue(undefined)

      const { validate } = useFieldValidation('button', 'label')
      validate('Click me')

      expect(mockGetContentSchemaForWidget).toHaveBeenCalledWith('button')
    })

    it('works with Ref widgetType', () => {
      mockGetContentSchemaForWidget.mockReturnValue(undefined)

      const widgetTypeRef = ref('button')
      const { validate } = useFieldValidation(widgetTypeRef, 'label')
      validate('Click me')

      expect(mockGetContentSchemaForWidget).toHaveBeenCalledWith('button')
    })
  })
})

describe('useWidgetValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial validation', () => {
    it('runs validation on creation', () => {
      mockGetContentValidationErrors.mockReturnValue({})

      const content = ref({ text: 'Hello' })
      useWidgetValidation('title', content)

      expect(mockGetContentValidationErrors).toHaveBeenCalledWith('title', { text: 'Hello' })
    })
  })

  describe('validate', () => {
    it('sets isValid to true when no errors', () => {
      mockGetContentValidationErrors.mockReturnValue({})

      const content = ref({ text: 'Hello' })
      const { isValid, validate } = useWidgetValidation('title', content)

      const result = validate()
      expect(result).toBe(true)
      expect(isValid.value).toBe(true)
    })

    it('sets isValid to false when errors exist', () => {
      mockGetContentValidationErrors.mockReturnValue({ text: 'Text is required' })

      const content = ref({ text: '' })
      const { isValid } = useWidgetValidation('title', content)

      expect(isValid.value).toBe(false)
    })
  })

  describe('getFieldError', () => {
    it('returns specific field error', () => {
      mockGetContentValidationErrors.mockReturnValue({
        text: 'Text is required',
        url: 'Invalid URL',
      })

      const content = ref({ text: '', url: 'bad' })
      const { getFieldError } = useWidgetValidation('button', content)

      expect(getFieldError('text')).toBe('Text is required')
      expect(getFieldError('url')).toBe('Invalid URL')
    })

    it('returns undefined for fields without errors', () => {
      mockGetContentValidationErrors.mockReturnValue({})

      const content = ref({ text: 'Valid' })
      const { getFieldError } = useWidgetValidation('title', content)

      expect(getFieldError('text')).toBeUndefined()
    })
  })

  describe('clearErrors', () => {
    it('resets errors and sets isValid to true', () => {
      mockGetContentValidationErrors.mockReturnValue({ text: 'Required' })

      const content = ref({ text: '' })
      const { clearErrors, isValid, errors } = useWidgetValidation('title', content)

      expect(isValid.value).toBe(false)
      expect(Object.keys(errors.value)).toHaveLength(1)

      clearErrors()

      expect(isValid.value).toBe(true)
      expect(Object.keys(errors.value)).toHaveLength(0)
    })
  })

  describe('auto-validation on content change', () => {
    it('re-validates when content changes', async () => {
      mockGetContentValidationErrors
        .mockReturnValueOnce({})
        .mockReturnValueOnce({ text: 'Too short' })

      const content = ref({ text: 'Hello' })
      const { isValid } = useWidgetValidation('title', content)

      expect(isValid.value).toBe(true)

      content.value = { text: 'Hi' }
      await nextTick()

      expect(mockGetContentValidationErrors).toHaveBeenCalledTimes(2)
      expect(isValid.value).toBe(false)
    })
  })
})
