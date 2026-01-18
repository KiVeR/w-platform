import { VERSION_LIMITS } from '../config/limits'
import prisma from './prisma'

/**
 * Increment version string (e.g., "1.5" -> "1.6")
 */
export function incrementVersion(version: string): string {
  const parts = version.split('.')
  const minor = Number.parseInt(parts[1] || '0', 10) + 1
  return `${parts[0]}.${minor}`
}

/**
 * Purge old versions beyond the limit
 * Returns the number of versions deleted
 */
export async function purgeOldVersions(landingPageId: number): Promise<number> {
  const count = await prisma.designVersion.count({
    where: { landingPageId },
  })

  if (count <= VERSION_LIMITS.MAX_VERSIONS_PER_PAGE) {
    return 0
  }

  const versionsToDelete = count - VERSION_LIMITS.MAX_VERSIONS_PER_PAGE

  // Get the oldest versions to delete
  const oldestVersions = await prisma.designVersion.findMany({
    where: { landingPageId },
    orderBy: { createdAt: 'asc' },
    take: versionsToDelete,
    select: { id: true },
  })

  const idsToDelete = oldestVersions.map(v => v.id)

  await prisma.designVersion.deleteMany({
    where: {
      id: { in: idsToDelete },
    },
  })

  return versionsToDelete
}

/**
 * Count widgets recursively in a design
 */
export function countWidgets(widgets: unknown[]): number {
  let count = 0
  for (const widget of widgets) {
    count++
    const w = widget as { children?: unknown[] }
    if (w.children && Array.isArray(w.children)) {
      count += countWidgets(w.children)
    }
  }
  return count
}
