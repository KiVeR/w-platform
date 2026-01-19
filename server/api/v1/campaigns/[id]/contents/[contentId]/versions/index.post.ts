import { z } from 'zod'

const restoreVersionSchema = z.object({
  versionId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const campaignId = Number(getRouterParam(event, 'id'))
  const contentId = Number(getRouterParam(event, 'contentId'))

  // Rate limit: 10 restores per hour
  const rateLimitResult = enforceRateLimit(event, user.id, RATE_LIMITS.VERSION_RESTORE)

  // Single optimized query for access check
  const content = await requireLandingPageWithAccess(contentId, campaignId, user.id)

  if (!content.landingPageData) {
    throw createError({
      statusCode: 404,
      message: 'Aucune donnée de design trouvée',
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

  const { versionId } = result.data

  // Get the version to restore
  const versionToRestore = await prisma.contentDesignVersion.findFirst({
    where: {
      id: versionId,
      landingPageDataId: content.landingPageData.id,
    },
  })

  if (!versionToRestore) {
    throw createError({
      statusCode: 404,
      message: 'Version non trouvée',
    })
  }

  // Use transaction for atomic restore
  const restoredVersion = await prisma.$transaction(async (tx) => {
    // Update the current design with the restored version's design
    await tx.landingPageData.update({
      where: { id: content.landingPageData!.id },
      data: { design: versionToRestore.design as object },
    })

    // Create a new version entry for the restored state
    const newVersion = await createDesignVersion(
      tx,
      content.landingPageData!.id,
      versionToRestore.design,
    )

    // Purge old versions if needed
    await purgeOldContentVersions(tx, content.landingPageData!.id)

    // Update content timestamp
    await tx.content.update({
      where: { id: contentId },
      data: { updatedAt: new Date() },
    })

    return newVersion
  })

  // Log audit
  await logAudit(event, {
    action: 'DESIGN_VERSION_RESTORED',
    entityType: 'CONTENT',
    entityId: contentId,
    details: {
      campaignId,
      restoredFromVersionId: versionId,
      restoredFromVersion: versionToRestore.version,
      newVersionId: restoredVersion.id,
      newVersion: restoredVersion.version,
    },
  })

  return {
    success: true,
    restoredFromVersion: versionToRestore.version,
    newVersion: restoredVersion.version,
    newVersionId: restoredVersion.id,
    rateLimit: formatRateLimitForResponse(rateLimitResult),
  }
})
