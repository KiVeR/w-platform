import { z } from 'zod'

// ==================== FORM ====================
export const formContentSchema = z.object({
  redirectUrl: z.string().optional(),
  successMessage: z.string().optional(),
  emailNotify: z.boolean().optional(),
  emailSubject: z.string().optional(),
  emailTo: z.string().email().optional().or(z.literal('')),
}).passthrough()

// ==================== FORM-FIELD ====================
export const formFieldTypeSchema = z.enum([
  'text',
  'email',
  'tel',
  'number',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'date',
  'file',
])

export const formFieldContentSchema = z.object({
  fieldType: formFieldTypeSchema,
  label: z.string().min(1, 'Field label is required'),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  name: z.string().optional(),
  options: z.array(z.string()).optional(), // For select, radio
  accept: z.string().optional(), // For file input
  min: z.union([z.string(), z.number()]).optional(),
  max: z.union([z.string(), z.number()]).optional(),
}).passthrough()

// Map of widget type to content schema
export const formWidgetContentSchemas = {
  'form': formContentSchema,
  'form-field': formFieldContentSchema,
} as const
