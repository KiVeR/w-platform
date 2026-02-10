import type { z } from 'zod'
import { baseWidgetContentSchemas } from './base.schema'
import { formWidgetContentSchemas } from './form.schema'
import { mediaWidgetContentSchemas } from './media.schema'
import { phase1WidgetContentSchemas } from './phase1.schema'
import { structureWidgetContentSchemas } from './structure.schema'
import { wellpackWidgetContentSchemas } from './wellpack.schema'

// Re-export all schemas
export * from './base.schema'
export * from './form.schema'
export * from './media.schema'
export * from './phase1.schema'
export * from './structure.schema'
export * from './wellpack.schema'

// Combined map of all widget content schemas
export const widgetContentSchemas = {
  ...baseWidgetContentSchemas,
  ...structureWidgetContentSchemas,
  ...formWidgetContentSchemas,
  ...mediaWidgetContentSchemas,
  ...wellpackWidgetContentSchemas,
  ...phase1WidgetContentSchemas,
} as const

export type WidgetContentSchemaType = keyof typeof widgetContentSchemas

/**
 * Get the content schema for a specific widget type
 */
export function getContentSchemaForWidget(widgetType: string): z.ZodTypeAny | undefined {
  return widgetContentSchemas[widgetType as WidgetContentSchemaType]
}

/**
 * Validate widget content against its specific schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateWidgetContent(
  widgetType: string,
  content: unknown,
): { success: true, data: unknown } | { success: false, error: z.ZodError } {
  const schema = getContentSchemaForWidget(widgetType)

  if (!schema) {
    // Unknown widget type - accept any content
    return { success: true, data: content }
  }

  const result = schema.safeParse(content)
  return result
}

/**
 * Get validation errors for widget content in a user-friendly format
 */
export function getContentValidationErrors(
  widgetType: string,
  content: unknown,
): Record<string, string> {
  const result = validateWidgetContent(widgetType, content)

  if (result.success) {
    return {}
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    errors[path] = issue.message
  }

  return errors
}
