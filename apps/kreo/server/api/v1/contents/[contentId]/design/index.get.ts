export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const contentId = Number(getRouterParam(event, 'contentId'))

  const content = await requireLandingPageWithAccess(contentId, user.id)

  if (!content.landingPageData) {
    throw createError({
      statusCode: 404,
      message: 'Design non trouvé',
    })
  }

  return {
    id: content.id,
    title: content.title,
    status: content.status,
    variableSchemaUuid: content.variableSchemaUuid,
    design: content.landingPageData.design,
    updatedAt: content.updatedAt,
  }
})
