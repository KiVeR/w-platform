import { describe, expect, it } from 'vitest'
import {
  buttonContentSchema,
  clickToCallContentSchema,
  formFieldContentSchema,
  getContentSchemaForWidget,
  getContentValidationErrors,
  imageContentSchema,
  titleContentSchema,
  validateWidgetContent,
  videoContentSchema,
} from '~~/shared/schemas/widgets'

describe('widget Content Schemas', () => {
  describe('titleContentSchema', () => {
    it('accepts valid title content', () => {
      const content = { text: 'Hello World' }
      expect(() => titleContentSchema.parse(content)).not.toThrow()
    })

    it('rejects empty text', () => {
      const content = { text: '' }
      expect(() => titleContentSchema.parse(content)).toThrow()
    })

    it('rejects missing text', () => {
      const content = {}
      expect(() => titleContentSchema.parse(content)).toThrow()
    })
  })

  describe('imageContentSchema', () => {
    it('accepts valid image content', () => {
      const content = { src: 'https://example.com/image.jpg', alt: 'An image' }
      expect(() => imageContentSchema.parse(content)).not.toThrow()
    })

    it('accepts image without alt', () => {
      const content = { src: 'https://example.com/image.jpg' }
      expect(() => imageContentSchema.parse(content)).not.toThrow()
    })

    it('rejects empty src', () => {
      const content = { src: '' }
      expect(() => imageContentSchema.parse(content)).toThrow()
    })
  })

  describe('buttonContentSchema', () => {
    it('accepts button with link action and href', () => {
      const content = {
        text: 'Click me',
        action: 'link',
        href: 'https://example.com',
      }
      expect(() => buttonContentSchema.parse(content)).not.toThrow()
    })

    it('accepts button with tel action and phone', () => {
      const content = {
        text: 'Call us',
        action: 'tel',
        phone: '+33123456789',
      }
      expect(() => buttonContentSchema.parse(content)).not.toThrow()
    })

    it('accepts button with email action and email', () => {
      const content = {
        text: 'Email us',
        action: 'email',
        email: 'contact@example.com',
      }
      expect(() => buttonContentSchema.parse(content)).not.toThrow()
    })

    it('rejects button with link action but no href', () => {
      const content = {
        text: 'Click me',
        action: 'link',
      }
      expect(() => buttonContentSchema.parse(content)).toThrow(/href/)
    })

    it('rejects button with tel action but no phone', () => {
      const content = {
        text: 'Call us',
        action: 'tel',
      }
      expect(() => buttonContentSchema.parse(content)).toThrow(/phone/)
    })

    it('rejects button with empty text', () => {
      const content = {
        text: '',
        action: 'link',
        href: 'https://example.com',
      }
      expect(() => buttonContentSchema.parse(content)).toThrow()
    })
  })

  describe('clickToCallContentSchema', () => {
    it('accepts valid click-to-call content', () => {
      const content = {
        text: 'Appeler',
        phone: '+33123456789',
      }
      expect(() => clickToCallContentSchema.parse(content)).not.toThrow()
    })

    it('rejects missing phone', () => {
      const content = {
        text: 'Appeler',
        phone: '',
      }
      expect(() => clickToCallContentSchema.parse(content)).toThrow()
    })
  })

  describe('formFieldContentSchema', () => {
    it('accepts valid form field', () => {
      const content = {
        fieldType: 'text',
        label: 'Your name',
      }
      expect(() => formFieldContentSchema.parse(content)).not.toThrow()
    })

    it('accepts form field with all options', () => {
      const content = {
        fieldType: 'email',
        label: 'Email address',
        placeholder: 'Enter your email',
        required: true,
        name: 'email',
      }
      expect(() => formFieldContentSchema.parse(content)).not.toThrow()
    })

    it('rejects invalid field type', () => {
      const content = {
        fieldType: 'invalid',
        label: 'Name',
      }
      expect(() => formFieldContentSchema.parse(content)).toThrow()
    })

    it('rejects empty label', () => {
      const content = {
        fieldType: 'text',
        label: '',
      }
      expect(() => formFieldContentSchema.parse(content)).toThrow()
    })
  })

  describe('videoContentSchema', () => {
    it('accepts empty video content', () => {
      const content = {}
      expect(() => videoContentSchema.parse(content)).not.toThrow()
    })

    it('accepts video with all options', () => {
      const content = {
        videoUrl: 'https://youtube.com/watch?v=xxx',
        videoProvider: 'youtube',
        autoplay: false,
        muted: true,
        loop: false,
        controls: true,
      }
      expect(() => videoContentSchema.parse(content)).not.toThrow()
    })

    it('rejects invalid provider', () => {
      const content = {
        videoProvider: 'invalid',
      }
      expect(() => videoContentSchema.parse(content)).toThrow()
    })
  })
})

describe('validateWidgetContent', () => {
  it('returns success for valid content', () => {
    const result = validateWidgetContent('title', { text: 'Hello' })
    expect(result.success).toBe(true)
  })

  it('returns error for invalid content', () => {
    const result = validateWidgetContent('title', { text: '' })
    expect(result.success).toBe(false)
  })

  it('returns success for unknown widget type', () => {
    const result = validateWidgetContent('unknown-type', { anything: true })
    expect(result.success).toBe(true)
  })
})

describe('getContentSchemaForWidget', () => {
  it('returns schema for known widget type', () => {
    const schema = getContentSchemaForWidget('button')
    expect(schema).toBeDefined()
  })

  it('returns undefined for unknown widget type', () => {
    const schema = getContentSchemaForWidget('unknown')
    expect(schema).toBeUndefined()
  })
})

describe('getContentValidationErrors', () => {
  it('returns empty object for valid content', () => {
    const errors = getContentValidationErrors('title', { text: 'Hello' })
    expect(errors).toEqual({})
  })

  it('returns errors for invalid content', () => {
    const errors = getContentValidationErrors('button', {
      text: 'Click',
      action: 'link',
      // Missing href
    })
    expect(errors).toHaveProperty('href')
  })
})
