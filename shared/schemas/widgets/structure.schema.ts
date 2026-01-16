import { z } from 'zod'

// ==================== ROW ====================
export const rowAlignSchema = z.enum(['stretch', 'flex-start', 'flex-end', 'center', 'baseline'])

export const rowContentSchema = z.object({
  gap: z.string().optional(),
  align: rowAlignSchema.optional(),
  wrap: z.boolean().optional(),
}).passthrough()

// ==================== COLUMN ====================
export const columnContentSchema = z.object({
  columnWidth: z.string().optional(),
}).passthrough()

// Map of widget type to content schema
export const structureWidgetContentSchemas = {
  row: rowContentSchema,
  column: columnContentSchema,
} as const
