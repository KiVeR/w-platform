import { MAX_PAYLOAD_SIZE, saveDesignSchema, validatePayloadSize } from '#shared/schemas/design.schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const campaignId = Number(getRouterParam(event, 'id'))
  const contentId = Number(getRouterParam(event, 'contentId'))

  // Rate limit: 60 saves per minute
  const rateLimitResult = enforceRateLimit(event, user.id, RATE_LIMITS.DESIGN_SAVE)

  // Single optimized query for access check
  const content = await requireLandingPageWithAccess(contentId, campaignId, user.id)

  // Read and validate payload size first (before parsing)
  const body = await readBody(event)
  const sizeValidation = validatePayloadSize(body)

  if (!sizeValidation.valid) {
    throw createError({
      statusCode: 413,
      message: sizeValidation.error ?? `Payload trop volumineux (max ${MAX_PAYLOAD_SIZE / 1024 / 1024}MB)`,
    })
  }

  // Validate design structure with strict schema
  const result = saveDesignSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { design, createVersion = true } = result.data

  // Use transaction for atomic operations
  const { updatedContent, version } = await prisma.$transaction(async (tx) => {
    let landingPageDataId: number

    // Update or create landing page data
    if (content.landingPageData) {
      await tx.landingPageData.update({
        where: { id: content.landingPageData.id },
        data: { design },
      })
      landingPageDataId = content.landingPageData.id
    }
    else {
      const newData = await tx.landingPageData.create({
        data: {
          contentId: content.id,
          design,
        },
      })
      landingPageDataId = newData.id
    }

    // Create version if requested (default: true)
    let newVersion = null
    if (createVersion) {
      newVersion = await createDesignVersion(tx, landingPageDataId, design)
      // Purge old versions (keep max 50)
      await purgeOldContentVersions(tx, landingPageDataId)
    }

    // Update content timestamp
    const updated = await tx.content.update({
      where: { id: contentId },
      data: { updatedAt: new Date() },
    })

    return { updatedContent: updated, version: newVersion }
  })

  return {
    success: true,
    id: content.id,
    updatedAt: updatedContent.updatedAt,
    version: version ? { id: version.id, version: version.version } : null,
    rateLimit: formatRateLimitForResponse(rateLimitResult),
  }
})
