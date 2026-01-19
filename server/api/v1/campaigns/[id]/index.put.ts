import { updateCampaignSchema } from '#shared/schemas/campaign.schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  await requireCampaignWithAccess(id, user.id)

  const body = await readBody(event)
  const result = updateCampaignSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { title, description, status, enabledContentTypes } = result.data

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(enabledContentTypes && {
        enabledContentTypes: enabledContentTypes.map(toPrismaContentType),
      }),
    },
    include: {
      _count: {
        select: {
          contents: true,
        },
      },
      contents: {
        select: {
          type: true,
        },
      },
    },
  })

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    enabledContentTypes: campaign.enabledContentTypes.map(toApiContentType),
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    _count: campaign._count,
    contentTypeSummary: campaign.contents.map(c => toApiContentType(c.type)),
  }
})
