import { contentIdParamsSchema } from '#shared/schemas/content.schema'

interface DeleteResponse {
  success: boolean
}

export default defineEventHandler(async (event): Promise<DeleteResponse> => {
  const user = await requireAuth(event)

  const params = contentIdParamsSchema.safeParse(event.context.params)
  if (!params.success) {
    throw createError({
      statusCode: 400,
      message: 'ID de contenu invalide',
    })
  }

  const { contentId } = params.data

  // Verify content exists and user has access
  const content = await requireContentWithAccess(contentId, user.id)

  // Soft delete the content
  await prisma.content.update({
    where: { id: contentId },
    data: { deletedAt: new Date() },
  })

  await createAuditLog(event, {
    action: 'CONTENT_DELETED',
    entityType: 'CONTENT',
    entityId: contentId,
    details: {
      title: content.title,
      type: content.type,
    },
  })

  return { success: true }
})
