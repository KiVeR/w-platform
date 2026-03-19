import { contentIdParamsSchema } from '#shared/schemas/content.schema'

interface FavoriteResponse {
  success: boolean
  isFavorite: boolean
}

export default defineEventHandler(async (event): Promise<FavoriteResponse> => {
  const user = await requireAuth(event)

  const params = contentIdParamsSchema.safeParse(event.context.params)
  if (!params.success) {
    throw createError({
      statusCode: 400,
      message: 'ID de contenu invalide',
    })
  }

  const { contentId } = params.data

  // Find the content and verify access
  const content = await requireContentWithAccess(contentId, user.id)

  // Toggle favorite status
  const updatedContent = await prisma.content.update({
    where: { id: contentId },
    data: { isFavorite: !content.isFavorite },
  })

  return {
    success: true,
    isFavorite: updatedContent.isFavorite,
  }
})
