import { logAudit } from '../../../../../../utils/audit'
import { requireContentWithCampaignAccess } from '../../../../../../utils/content-access'
import { requireAuth } from '../../../../../../utils/permissions'
import prisma from '../../../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const campaignId = Number(getRouterParam(event, 'id'))
  const contentId = Number(getRouterParam(event, 'contentId'))

  // Check for hard delete query param
  const query = getQuery(event)
  const hardDelete = query.hard === 'true'

  // Single optimized query for access check
  const content = await requireContentWithCampaignAccess(contentId, campaignId, user.id)

  if (hardDelete) {
    // Hard delete: permanently remove from database
    await prisma.content.delete({
      where: { id: contentId },
    })

    await logAudit(event, {
      action: 'CONTENT_DELETED',
      entityType: 'CONTENT',
      entityId: contentId,
      details: {
        campaignId,
        title: content.title,
        type: content.type,
        hardDelete: true,
      },
    })
  }
  else {
    // Soft delete: set deletedAt timestamp
    await prisma.content.update({
      where: { id: contentId },
      data: { deletedAt: new Date() },
    })

    await logAudit(event, {
      action: 'CONTENT_DELETED',
      entityType: 'CONTENT',
      entityId: contentId,
      details: {
        campaignId,
        title: content.title,
        type: content.type,
        hardDelete: false,
      },
    })
  }

  setResponseStatus(event, 204)
  return null
})
