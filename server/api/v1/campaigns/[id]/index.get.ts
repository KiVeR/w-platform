import { requireCampaignWithAccess } from '../../../../utils/content-access'
import { toApiContentType } from '../../../../utils/content-type-mapper'
import { requireAuth } from '../../../../utils/permissions'
import prisma from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  await requireCampaignWithAccess(id, user.id)

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      contents: {
        select: {
          id: true,
          type: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
      _count: {
        select: {
          contents: true,
        },
      },
    },
  })

  return {
    id: campaign!.id,
    title: campaign!.title,
    description: campaign!.description,
    status: campaign!.status,
    enabledContentTypes: campaign!.enabledContentTypes.map(toApiContentType),
    createdAt: campaign!.createdAt,
    updatedAt: campaign!.updatedAt,
    _count: campaign!._count,
    contents: campaign!.contents.map(content => ({
      id: content.id,
      type: toApiContentType(content.type),
      title: content.title,
      status: content.status,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    })),
  }
})
