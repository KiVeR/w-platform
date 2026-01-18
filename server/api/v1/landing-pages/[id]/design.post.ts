import { saveDesignSchema } from '../../../../../shared/schemas/design.schema'
import { createAuditLog } from '../../../../utils/audit'
import { requireAuth, requireLandingPage, requirePermission } from '../../../../utils/permissions'
import prisma from '../../../../utils/prisma'
import { countWidgets, incrementVersion, purgeOldVersions } from '../../../../utils/version'

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  // Get landing page ID from route params
  const id = Number(getRouterParam(event, 'id'))

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'ID invalide',
    })
  }

  // Verify landing page exists
  await requireLandingPage(id)

  // Check permission (EDIT or higher)
  await requirePermission(user.id, id, 'EDIT')

  // Parse and validate body
  const body = await readBody(event)
  const result = saveDesignSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Design invalide',
      data: result.error.flatten(),
    })
  }

  const { design, createVersion } = result.data
  const widgetCount = countWidgets(design.widgets)

  // Get latest version to determine new version number
  const latestVersion = await prisma.designVersion.findFirst({
    where: { landingPageId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, version: true },
  })

  let designVersion

  if (createVersion || !latestVersion) {
    // Create new version
    const newVersionNumber = latestVersion
      ? incrementVersion(latestVersion.version)
      : '1.0'

    designVersion = await prisma.designVersion.create({
      data: {
        landingPageId: id,
        version: newVersionNumber,
        design: design as object,
        widgetCount,
      },
    })
  }
  else {
    // Update existing version
    designVersion = await prisma.designVersion.update({
      where: { id: latestVersion.id },
      data: {
        design: design as object,
        widgetCount,
      },
    })
  }

  // Update landing page timestamp
  await prisma.landingPage.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  // Purge old versions if a new version was created
  let purgedCount = 0
  if (createVersion || !latestVersion) {
    purgedCount = await purgeOldVersions(id)
  }

  // Audit log for save
  await createAuditLog(event, {
    userId: user.id,
    action: 'DESIGN_SAVED',
    entityType: 'LANDING_PAGE',
    entityId: id,
    details: {
      versionId: designVersion.id,
      version: designVersion.version,
      widgetCount,
      createVersion,
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
        reason: 'auto_purge_on_save',
      },
    })
  }

  return {
    id: designVersion.id,
    version: designVersion.version,
    widgetCount: designVersion.widgetCount,
    createdAt: designVersion.createdAt,
  }
})
