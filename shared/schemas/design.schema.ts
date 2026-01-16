import { z } from 'zod'

// Widget types enum
export const widgetTypeSchema = z.enum([
  // Base
  'title',
  'text',
  'image',
  'button',
  'separator',
  'spacer',
  'click-to-call',
  // Structure
  'row',
  'column',
  // Forms
  'form',
  'form-field',
  // Media
  'video',
  'map',
  'social',
  'icon',
  // Wellpack
  'barcode',
  'store-locator',
  'drive',
  'scratch',
  'flipcard',
  // Advanced
  'gallery',
  'slider',
  'link-image',
  'effect',
])

// Widget content - flexible object to allow all widget-specific properties
export const widgetContentSchema = z.record(z.unknown()).optional()

// Widget styles - flexible object for CSS properties
export const widgetStylesSchema = z.record(z.string().optional()).optional()

// Recursive widget schema
export const widgetSchema: z.ZodType<{
  id: string
  type: string
  order: number
  content?: Record<string, unknown>
  styles?: Record<string, string | undefined>
  children?: unknown[]
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: widgetTypeSchema,
    order: z.number().int().min(0),
    content: widgetContentSchema,
    styles: widgetStylesSchema,
    children: z.array(widgetSchema).optional(),
  }),
)

// Global styles
export const globalStylesSchema = z.object({
  palette: z.string().optional(),
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  maxWidth: z.number().optional(),
}).passthrough() // Allow additional properties

// Design document
export const designDocumentSchema = z.object({
  version: z.string().optional(),
  globalStyles: globalStylesSchema,
  widgets: z.array(widgetSchema),
})

// Save design request body
export const saveDesignSchema = z.object({
  design: designDocumentSchema,
  createVersion: z.boolean().default(true), // Whether to create a new version or update latest
})

// Infer types
export type WidgetType = z.infer<typeof widgetTypeSchema>
export type WidgetSchema = z.infer<typeof widgetSchema>
export type GlobalStylesSchema = z.infer<typeof globalStylesSchema>
export type DesignDocumentSchema = z.infer<typeof designDocumentSchema>
export type SaveDesignInput = z.infer<typeof saveDesignSchema>
