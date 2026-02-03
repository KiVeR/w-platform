import { z } from 'zod'

// ==================== COUNTDOWN ====================
export const countdownContentSchema = z.object({
  targetDate: z.string().describe('ISO 8601 date string for countdown target (e.g., "2026-12-31T23:59:59")'),
  label: z.string().optional().describe('Text shown above countdown (e.g., "Offre expire dans", "Fin de la promo")'),
  expiredLabel: z.string().optional().describe('Text shown when countdown reaches zero (e.g., "Offre terminée")'),
  showDays: z.boolean().optional().describe('Whether to display days unit (default: true)'),
  showHours: z.boolean().optional().describe('Whether to display hours unit (default: true)'),
  showMinutes: z.boolean().optional().describe('Whether to display minutes unit (default: true)'),
  showSeconds: z.boolean().optional().describe('Whether to display seconds unit (default: true)'),
}).strict()

// ==================== TESTIMONIAL ====================
export const testimonialContentSchema = z.object({
  quote: z.string().min(1).describe('The customer testimonial text - compelling quote from a satisfied customer'),
  author: z.string().min(1).describe('Full name of the person giving testimonial'),
  role: z.string().optional().describe('Job title or role of the author (e.g., "Directeur Marketing")'),
  avatarUrl: z.string().optional().describe('URL to author profile picture (square image recommended)'),
  rating: z.number().min(0).max(5).optional().describe('Star rating from 0 to 5 (supports half stars like 4.5)'),
  company: z.string().optional().describe('Company or organization name of the author'),
}).strict()

// ==================== BADGE ====================
export const badgeVariantSchema = z.enum(['filled', 'outline']).describe('Visual style: "filled" for solid background, "outline" for border only')

export const badgeContentSchema = z.object({
  text: z.string().min(1).describe('Badge text - short, impactful (e.g., "NOUVEAU", "-30%", "PROMO", "BEST-SELLER")'),
  variant: badgeVariantSchema.optional().default('filled').describe('Visual style: "filled" (solid background) or "outline" (border only)'),
}).strict()

// Map of widget type to content schema
export const phase1WidgetContentSchemas = {
  countdown: countdownContentSchema,
  testimonial: testimonialContentSchema,
  badge: badgeContentSchema,
} as const
