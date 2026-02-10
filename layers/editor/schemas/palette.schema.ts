import { z } from 'zod'

// Hex color validation (6-character format, case-insensitive)
export const hexColorSchema = z.string().regex(
  /^#[0-9a-f]{6}$/i,
  'Must be a valid 6-character hex color (e.g., #ffffff)',
)

// Base palette schema
export const paletteSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  primary: hexColorSchema,
  primaryDark: hexColorSchema,
  background: hexColorSchema,
  text: hexColorSchema,
  isDark: z.boolean().optional(),
})

export type PaletteSchema = z.infer<typeof paletteSchema>

// User palette with metadata
export const userPaletteSchema = paletteSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.literal(1),
})

export type UserPalette = z.infer<typeof userPaletteSchema>

// Storage format for localStorage
export const userPalettesStorageSchema = z.object({
  version: z.number().int().min(1),
  palettes: z.array(userPaletteSchema),
})

export type UserPalettesStorage = z.infer<typeof userPalettesStorageSchema>

// Validation helpers
export function parseUserPalettes(data: unknown): UserPalette[] {
  const result = userPalettesStorageSchema.safeParse(data)
  if (result.success) {
    return result.data.palettes
  }
  console.warn('Invalid user palettes data:', result.error.flatten())
  return []
}

export function validateUserPalette(palette: unknown): palette is UserPalette {
  return userPaletteSchema.safeParse(palette).success
}
