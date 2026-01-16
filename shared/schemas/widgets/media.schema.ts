import { z } from 'zod'

// ==================== VIDEO ====================
export const videoProviderSchema = z.enum(['youtube', 'vimeo', 'dailymotion', 'custom'])

export const videoContentSchema = z.object({
  videoUrl: z.string().optional(),
  videoProvider: videoProviderSchema.optional(),
  autoplay: z.boolean().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
  controls: z.boolean().optional(),
}).passthrough()

// ==================== MAP ====================
export const mapStyleSchema = z.enum(['roadmap', 'satellite', 'terrain', 'hybrid'])

export const mapContentSchema = z.object({
  address: z.string().optional(),
  zoom: z.number().min(1).max(21).optional(),
  mapStyle: mapStyleSchema.optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
}).passthrough()

// ==================== SOCIAL ====================
export const socialPlatformSchema = z.enum([
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'youtube',
  'whatsapp',
  'tiktok',
  'pinterest',
])

export const socialLinkSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string().optional(),
  enabled: z.boolean().optional(),
})

export const socialStyleSchema = z.enum(['icons', 'buttons', 'text'])
export const socialSizeSchema = z.enum(['small', 'medium', 'large'])

export const socialContentSchema = z.object({
  socialLinks: z.array(socialLinkSchema).optional(),
  socialStyle: socialStyleSchema.optional(),
  socialSize: socialSizeSchema.optional(),
}).passthrough()

// ==================== ICON ====================
export const iconContentSchema = z.object({
  iconName: z.string().optional(),
  iconSize: z.string().optional(),
  iconColor: z.string().optional(),
  href: z.string().optional(),
}).passthrough()

// ==================== GALLERY ====================
export const galleryImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
})

export const galleryContentSchema = z.object({
  galleryImages: z.array(galleryImageSchema).optional(),
  galleryButtonText: z.string().optional(),
}).passthrough()

// ==================== SLIDER ====================
export const sliderImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  href: z.string().optional(),
})

export const sliderContentSchema = z.object({
  sliderImages: z.array(sliderImageSchema).optional(),
  sliderInterval: z.number().min(500).optional(),
  sliderChevronColor: z.string().optional(),
  sliderAutoplay: z.boolean().optional(),
}).passthrough()

// ==================== EFFECT ====================
export const effectDirectionSchema = z.enum(['up', 'down', 'left', 'right'])

export const effectContentSchema = z.object({
  effectImage: z.string().optional(),
  effectSize: z.number().min(1).optional(),
  effectTimer: z.number().min(10).optional(),
  effectScale: z.number().min(1).optional(),
  effectNbItems: z.number().min(1).max(200).optional(),
  effectSpeed: z.number().min(1).optional(),
  effectDirection: effectDirectionSchema.optional(),
}).passthrough()

// Map of widget type to content schema
export const mediaWidgetContentSchemas = {
  video: videoContentSchema,
  map: mapContentSchema,
  social: socialContentSchema,
  icon: iconContentSchema,
  gallery: galleryContentSchema,
  slider: sliderContentSchema,
  effect: effectContentSchema,
} as const
