import type { ContentType } from '../../shared/types/content'

export type PrismaContentType = 'LANDING_PAGE' | 'RCS' | 'SMS'

const API_TO_PRISMA: Record<ContentType, PrismaContentType> = {
  'landing-page': 'LANDING_PAGE',
  'rcs': 'RCS',
  'sms': 'SMS',
}

const PRISMA_TO_API: Record<PrismaContentType, ContentType> = {
  LANDING_PAGE: 'landing-page',
  RCS: 'rcs',
  SMS: 'sms',
}

/**
 * Convert API content type to Prisma enum value
 */
export function toPrismaContentType(type: ContentType): PrismaContentType {
  return API_TO_PRISMA[type]
}

/**
 * Convert Prisma enum value to API content type
 */
export function toApiContentType(prismaType: string): ContentType {
  return PRISMA_TO_API[prismaType as PrismaContentType] || 'landing-page'
}

/**
 * Convert array of API content types to Prisma enum values
 */
export function toPrismaContentTypes(types: ContentType[]): PrismaContentType[] {
  return types.map(toPrismaContentType)
}

/**
 * Convert array of Prisma enum values to API content types
 */
export function toApiContentTypes(prismaTypes: string[]): ContentType[] {
  return prismaTypes.map(toApiContentType)
}
