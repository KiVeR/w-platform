export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  // Check for hard delete query param
  const query = getQuery(event)
  const hardDelete = query.hard === 'true'

  // Use the optimized helper with soft delete filter
  const campaign = await requireCampaignWithAccess(id, user.id)

  if (hardDelete) {
    // Hard delete: permanently remove from database
    await prisma.campaign.delete({
      where: { id },
    })

    await logAudit(event, {
      action: 'CAMPAIGN_DELETED',
      entityType: 'CAMPAIGN',
      entityId: id,
      details: {
        title: campaign.title,
        hardDelete: true,
      },
    })
  }
  else {
    // Soft delete: set deletedAt timestamp
    await prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await logAudit(event, {
      action: 'CAMPAIGN_DELETED',
      entityType: 'CAMPAIGN',
      entityId: id,
      details: {
        title: campaign.title,
        hardDelete: false,
      },
    })
  }

  setResponseStatus(event, 204)
  return null
})
