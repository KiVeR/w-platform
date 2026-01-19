export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const campaignId = Number(getRouterParam(event, 'id'))
  const contentId = Number(getRouterParam(event, 'contentId'))
  const versionId = Number(getRouterParam(event, 'versionId'))

  if (Number.isNaN(versionId) || versionId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de version invalide',
    })
  }

  // Single optimized query for access check
  const content = await requireLandingPageWithAccess(contentId, campaignId, user.id)

  if (!content.landingPageData) {
    throw createError({
      statusCode: 404,
      message: 'Version non trouvée',
    })
  }

  // Get the specific version
  const version = await prisma.contentDesignVersion.findFirst({
    where: {
      id: versionId,
      landingPageDataId: content.landingPageData.id,
    },
  })

  if (!version) {
    throw createError({
      statusCode: 404,
      message: 'Version non trouvée',
    })
  }

  // Check if this is the current (most recent) version
  const latestVersion = await prisma.contentDesignVersion.findFirst({
    where: { landingPageDataId: content.landingPageData.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  return {
    id: version.id,
    version: version.version,
    design: version.design,
    widgetCount: version.widgetCount,
    createdAt: version.createdAt,
    isCurrent: latestVersion?.id === version.id,
  }
})
