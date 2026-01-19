import { z } from 'zod'

const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const campaignId = Number(getRouterParam(event, 'id'))
  const contentId = Number(getRouterParam(event, 'contentId'))

  // Single optimized query for access check
  const content = await requireContentWithCampaignAccess(contentId, campaignId, user.id)

  const body = await readBody(event)
  const result = updateContentSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { title, status } = result.data

  // Only update if there are changes
  if (!title && !status) {
    return {
      id: content.id,
      type: content.type,
      campaignId: content.campaignId,
      title: content.title,
      status: content.status,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    }
  }

  const updatedContent = await prisma.content.update({
    where: { id: contentId },
    data: {
      ...(title && { title }),
      ...(status && { status }),
    },
  })

  // Log audit
  await logAudit(event, {
    action: 'CONTENT_UPDATED',
    entityType: 'CONTENT',
    entityId: contentId,
    details: {
      campaignId,
      changes: { title, status },
    },
  })

  return {
    id: updatedContent.id,
    type: updatedContent.type,
    campaignId: updatedContent.campaignId,
    title: updatedContent.title,
    status: updatedContent.status,
    createdAt: updatedContent.createdAt,
    updatedAt: updatedContent.updatedAt,
  }
})
