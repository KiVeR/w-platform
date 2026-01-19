import type { ContentType } from '#shared/types/content'
import { campaignPaginationSchema } from '#shared/schemas/campaign.schema'

interface CampaignListItem {
  id: number
  title: string
  description: string | null
  status: string
  enabledContentTypes: ContentType[]
  createdAt: Date
  updatedAt: Date
  _count: {
    contents: number
  }
  contentTypeSummary: ContentType[]
}

interface PaginatedResponse {
  data: CampaignListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default defineEventHandler(async (event): Promise<PaginatedResponse> => {
  const user = await requireAuth(event)

  const query = getQuery(event)
  const result = campaignPaginationSchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Paramètres de pagination invalides',
      data: result.error.flatten(),
    })
  }

  const { page, limit, status, search, sortBy, sortOrder } = result.data

  const whereClause = {
    ownerId: user.id,
    deletedAt: null, // Filter out soft-deleted campaigns
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const total = await prisma.campaign.count({
    where: whereClause,
  })

  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
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
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  })

  const data: CampaignListItem[] = campaigns.map(campaign => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    enabledContentTypes: campaign.enabledContentTypes.map(toApiContentType),
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    _count: campaign._count,
    contentTypeSummary: campaign.contents.map(c => toApiContentType(c.type)),
  }))

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
