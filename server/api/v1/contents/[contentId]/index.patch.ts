import { contentIdParamsSchema, updateContentSchema } from '#shared/schemas/content.schema'

interface UpdateContentResponse {
  id: number
  title: string
  status: string
  variableSchemaUuid: string | null
  updatedAt: string
}

export default defineEventHandler(async (event): Promise<UpdateContentResponse> => {
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
  await requireContentWithAccess(contentId, user.id)

  const body = await readBody(event)
  const parsed = updateContentSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Données invalides',
    })
  }

  const { title, status, variableSchemaUuid } = parsed.data

  // Build update data
  const updateData: { title?: string, status?: string, variableSchemaUuid?: string | null } = {}
  if (title !== undefined)
    updateData.title = title.trim()
  if (status !== undefined)
    updateData.status = status
  if (variableSchemaUuid !== undefined)
    updateData.variableSchemaUuid = variableSchemaUuid

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Aucune modification fournie',
    })
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: updateData,
    select: {
      id: true,
      title: true,
      status: true,
      variableSchemaUuid: true,
      updatedAt: true,
    },
  })

  await createAuditLog(event, {
    action: 'CONTENT_UPDATED',
    entityType: 'CONTENT',
    entityId: contentId,
    details: updateData,
  })

  return {
    id: updated.id,
    title: updated.title,
    status: updated.status,
    variableSchemaUuid: updated.variableSchemaUuid,
    updatedAt: updated.updatedAt.toISOString(),
  }
})
