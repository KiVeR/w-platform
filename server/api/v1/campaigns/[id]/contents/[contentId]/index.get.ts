export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const campaignId = Number(getRouterParam(event, 'id'))
  const contentId = Number(getRouterParam(event, 'contentId'))

  // Single optimized query for access check
  const content = await requireContentWithCampaignAccess(contentId, campaignId, user.id)

  return {
    id: content.id,
    type: content.type,
    campaignId: content.campaignId,
    title: content.title,
    status: content.status,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  }
})
