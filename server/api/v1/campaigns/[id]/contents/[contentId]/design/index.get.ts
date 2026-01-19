import { requireLandingPageWithAccess } from '../../../../../../../utils/content-access'
import { requireAuth } from '../../../../../../../utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const campaignId = Number(getRouterParam(event, 'id'))
  const contentId = Number(getRouterParam(event, 'contentId'))

  const content = await requireLandingPageWithAccess(contentId, campaignId, user.id)

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
    design: content.landingPageData.design,
    updatedAt: content.updatedAt,
  }
})
