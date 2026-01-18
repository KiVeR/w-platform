import { VERSION_LIMITS } from '../../../../../../server/config/limits'
import { restoreVersionSchema } from '../../../../../../shared/schemas/version.schema'
import { createAuditLog } from '../../../../../utils/audit'
import { requireAuth, requireLandingPage, requirePermission } from '../../../../../utils/permissions'
import prisma from '../../../../../utils/prisma'
import { countWidgets, incrementVersion, purgeOldVersions } from '../../../../../utils/version'

// Simple in-memory rate limiter (per user)
const restoreRateLimiter = new Map<number, number[]>()

function checkRateLimit(userId: number): boolean {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000

  const timestamps = restoreRateLimiter.get(userId) || []
  const recentTimestamps = timestamps.filter(t => t > oneHourAgo)

  if (recentTimestamps.length >= VERSION_LIMITS.RATE_LIMIT_RESTORE_PER_HOUR) {
    return false
  }

  recentTimestamps.push(now)
  restoreRateLimiter.set(userId, recentTimestamps)
  return true
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'ID invalide',
    })
  }

  await requireLandingPage(id)
  await requirePermission(user.id, id, 'EDIT')

  // Rate limiting
  if (!checkRateLimit(user.id)) {
    throw createError({
      statusCode: 429,
      message: `Limite atteinte : ${VERSION_LIMITS.RATE_LIMIT_RESTORE_PER_HOUR} restaurations par heure`,
    })
  }

  const body = await readBody(event)
  const result = restoreVersionSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { fromVersionId, comment } = result.data

  // Find the source version
  const sourceVersion = await prisma.designVersion.findFirst({
    where: {
      id: fromVersionId,
      landingPageId: id,
    },
  })

  if (!sourceVersion) {
    throw createError({
      statusCode: 404,
      message: 'Version source non trouvée',
    })
  }

  // Get latest version for incrementing
  const latestVersion = await prisma.designVersion.findFirst({
    where: { landingPageId: id },
    orderBy: { createdAt: 'desc' },
    select: { version: true },
  })

  const newVersionNumber = latestVersion
    ? incrementVersion(latestVersion.version)
    : '1.0'

  const design = sourceVersion.design as { widgets?: unknown[] }
  const widgetCount = design.widgets ? countWidgets(design.widgets) : 0

  // Create new version with the restored design (atomic transaction)
  const [newVersion] = await prisma.$transaction([
    prisma.designVersion.create({
      data: {
        landingPageId: id,
        version: newVersionNumber,
        design: sourceVersion.design as object,
        widgetCount,
      },
    }),
    prisma.landingPage.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
  ])

  // Purge old versions if needed
  const purgedCount = await purgeOldVersions(id)

  // Audit log for restore
  await createAuditLog(event, {
    userId: user.id,
    action: 'DESIGN_VERSION_RESTORED',
    entityType: 'LANDING_PAGE',
    entityId: id,
    details: {
      fromVersionId,
      fromVersion: sourceVersion.version,
      newVersionId: newVersion.id,
      newVersion: newVersion.version,
      comment,
    },
  })

  // Audit log for purge if any
  if (purgedCount > 0) {
    await createAuditLog(event, {
      userId: user.id,
      action: 'DESIGN_VERSION_PURGED',
      entityType: 'LANDING_PAGE',
      entityId: id,
      details: {
        purgedCount,
        reason: 'auto_purge_on_restore',
      },
    })
  }

  return {
    id: newVersion.id,
    version: newVersion.version,
    widgetCount: newVersion.widgetCount,
    createdAt: newVersion.createdAt,
    restoredFrom: {
      id: sourceVersion.id,
      version: sourceVersion.version,
    },
    purgedVersions: purgedCount,
  }
})
