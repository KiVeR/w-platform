import type { PrismaClient } from '@prisma/client'
import { getWidgetCount } from '#shared/schemas/design.schema'
import prisma from './prisma'

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Maximum number of versions to keep per content */
export const MAX_VERSIONS_PER_CONTENT = 50

/** Default page size for version listing */
export const DEFAULT_PAGE_SIZE = 20

// =============================================================================
// VERSION UTILITIES
// =============================================================================

/**
 * Increment version string (e.g., "1.0" -> "1.1", "1.9" -> "1.10")
 */
export function incrementContentVersion(currentVersion: string): string {
  const parts = currentVersion.split('.')
  if (parts.length !== 2) {
    return '1.0'
  }

  const major = Number.parseInt(parts[0], 10) || 1
  const minor = Number.parseInt(parts[1], 10) || 0

  return `${major}.${minor + 1}`
}

/**
 * Get the latest version number for a landing page data
 */
export async function getLatestVersion(landingPageDataId: number): Promise<string> {
  const latest = await prisma.contentDesignVersion.findFirst({
    where: { landingPageDataId },
    orderBy: { createdAt: 'desc' },
    select: { version: true },
  })

  return latest?.version ?? '0.0'
}

/**
 * Count widgets in a design document
 */
export function countWidgetsInDesign(design: unknown): number {
  if (!design || typeof design !== 'object') {
    return 0
  }

  const designObj = design as { widgets?: unknown[] }
  if (!Array.isArray(designObj.widgets)) {
    return 0
  }

  return getWidgetCount(designObj.widgets as { id: string, type: string, children?: unknown[] }[])
}

/**
 * Create a new design version
 */
export async function createDesignVersion(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  landingPageDataId: number,
  design: unknown,
): Promise<{ id: number, version: string }> {
  // Get current latest version
  const latestVersion = await tx.contentDesignVersion.findFirst({
    where: { landingPageDataId },
    orderBy: { createdAt: 'desc' },
    select: { version: true },
  })

  const newVersion = incrementContentVersion(latestVersion?.version ?? '0.0')
  const widgetCount = countWidgetsInDesign(design)

  const version = await tx.contentDesignVersion.create({
    data: {
      landingPageDataId,
      version: newVersion,
      design: design as object,
      widgetCount,
    },
    select: {
      id: true,
      version: true,
    },
  })

  return version
}

/**
 * Purge old versions beyond the maximum limit
 * Keeps the most recent MAX_VERSIONS_PER_CONTENT versions
 */
export async function purgeOldContentVersions(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  landingPageDataId: number,
): Promise<number> {
  // Get versions to delete (oldest beyond limit)
  const versionsToDelete = await tx.contentDesignVersion.findMany({
    where: { landingPageDataId },
    orderBy: { createdAt: 'desc' },
    skip: MAX_VERSIONS_PER_CONTENT,
    select: { id: true },
  })

  if (versionsToDelete.length === 0) {
    return 0
  }

  const deleteIds = versionsToDelete.map(v => v.id)

  await tx.contentDesignVersion.deleteMany({
    where: { id: { in: deleteIds } },
  })

  return deleteIds.length
}

/**
 * Get version count for a landing page data
 */
export async function getVersionCount(landingPageDataId: number): Promise<number> {
  return prisma.contentDesignVersion.count({
    where: { landingPageDataId },
  })
}

// =============================================================================
// TYPES
// =============================================================================

export interface VersionListItem {
  id: number
  version: string
  widgetCount: number
  createdAt: Date
  isCurrent: boolean
}

export interface VersionDetail {
  id: number
  version: string
  design: unknown
  widgetCount: number
  createdAt: Date
  isCurrent: boolean
}

export interface PaginatedVersions {
  versions: VersionListItem[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
