import { z } from 'zod'

// ==================== BARCODE ====================
export const barcodeTypeSchema = z.enum([
  'ean13',
  'ean8',
  'upc',
  'code128',
  'code39',
  'qrcode',
])

export const barcodeContentSchema = z.object({
  barcodeCode: z.string().min(1, 'Barcode value is required'),
  barcodeType: barcodeTypeSchema.optional(),
  barcodeColor: z.string().optional(),
  barcodeVariable: z.string().optional(),
}).passthrough()

// ==================== STORE-LOCATOR ====================
export const storeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  hours: z.string().optional(),
})

export const storeLocatorContentSchema = z.object({
  storeLocatorLabel: z.string().optional(),
  storeLocatorButtonText: z.string().optional(),
  storeLocatorButtonColor: z.string().optional(),
  storeLocatorStores: z.array(storeSchema).optional(),
}).passthrough()

// ==================== DRIVE ====================
export const driveStoreSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  distance: z.number().optional(),
})

export const driveContentSchema = z.object({
  driveButtonText: z.string().optional(),
  driveButtonColor: z.string().optional(),
  driveStores: z.array(driveStoreSchema).optional(),
  driveBtnGoLabel: z.string().optional(),
  driveBtnCallLabel: z.string().optional(),
  driveBtnGoColor: z.string().optional(),
  driveBtnCallColor: z.string().optional(),
}).passthrough()

// ==================== SCRATCH ====================
export const scratchContentSchema = z.object({
  scratchImageFg: z.string().optional(),
  scratchImageBg: z.string().optional(),
  scratchSize: z.number().min(1).max(100).optional(),
  scratchPercent: z.number().min(1).max(100).optional(),
  scratchLink: z.string().optional(),
}).passthrough()

// ==================== FLIPCARD ====================
export const flipcardContentSchema = z.object({
  flipcardImageFront: z.string().optional(),
  flipcardImageBack: z.string().optional(),
  flipcardLink: z.string().optional(),
}).passthrough()

// Map of widget type to content schema
export const wellpackWidgetContentSchemas = {
  'barcode': barcodeContentSchema,
  'store-locator': storeLocatorContentSchema,
  'drive': driveContentSchema,
  'scratch': scratchContentSchema,
  'flipcard': flipcardContentSchema,
} as const
