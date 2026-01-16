import { z } from 'zod'

// ==================== TITLE ====================
export const titleContentSchema = z.object({
  text: z.string().min(1, 'Title text is required'),
}).passthrough()

// ==================== TEXT ====================
export const textContentSchema = z.object({
  text: z.string(),
}).passthrough()

// ==================== IMAGE ====================
export const imageContentSchema = z.object({
  src: z.string().min(1, 'Image source is required'),
  alt: z.string().optional(),
}).passthrough()

// ==================== BUTTON ====================
export const buttonActionSchema = z.enum(['link', 'tel', 'email'])

export const buttonContentSchema = z.object({
  text: z.string().min(1, 'Button text is required'),
  action: buttonActionSchema,
  href: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === 'link') {
      return data.href !== undefined && data.href.length > 0
    }
    return true
  },
  { message: 'href is required when action is "link"', path: ['href'] },
).refine(
  (data) => {
    if (data.action === 'tel') {
      return data.phone !== undefined && data.phone.length > 0
    }
    return true
  },
  { message: 'phone is required when action is "tel"', path: ['phone'] },
).refine(
  (data) => {
    if (data.action === 'email') {
      return data.email !== undefined && data.email.length > 0
    }
    return true
  },
  { message: 'email is required when action is "email"', path: ['email'] },
)

// ==================== SEPARATOR ====================
export const separatorContentSchema = z.object({}).passthrough()

// ==================== SPACER ====================
export const spacerContentSchema = z.object({}).passthrough()

// ==================== CLICK-TO-CALL ====================
export const clickToCallContentSchema = z.object({
  text: z.string().min(1, 'Button text is required'),
  phone: z.string().min(1, 'Phone number is required'),
  action: z.literal('tel').optional(),
}).passthrough()

// ==================== LINK-IMAGE ====================
export const linkImageContentSchema = z.object({
  linkImageSrc: z.string().min(1, 'Image source is required'),
  linkImageAlt: z.string().optional(),
  linkImageHref: z.string().optional(),
}).passthrough()

// Map of widget type to content schema
export const baseWidgetContentSchemas = {
  'title': titleContentSchema,
  'text': textContentSchema,
  'image': imageContentSchema,
  'button': buttonContentSchema,
  'separator': separatorContentSchema,
  'spacer': spacerContentSchema,
  'click-to-call': clickToCallContentSchema,
  'link-image': linkImageContentSchema,
} as const
