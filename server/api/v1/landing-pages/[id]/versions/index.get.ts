import { versionListQuerySchema } from '../../../../../../shared/schemas/version.schema'
import { requireAuth, requireLandingPage, requirePermission } from '../../../../../utils/permissions'
import prisma from '../../../../../utils/prisma'

interface VersionSummary {
  id: number
  version: string
  widgetCount: number
  createdAt: Date
  isLatest: boolean
}

interface PaginatedResponse {
  data: VersionSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default defineEventHandler(async (event): Promise<PaginatedResponse> => {
  const user = await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'ID invalide',
    })
  }

  await requireLandingPage(id)
  await requirePermission(user.id, id, 'VIEW')

  const query = getQuery(event)
  const result = versionListQuerySchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Paramètres invalides',
      data: result.error.flatten(),
    })
  }

  const { page, limit, sortOrder } = result.data

  const total = await prisma.designVersion.count({
    where: { landingPageId: id },
  })

  const latestVersion = await prisma.designVersion.findFirst({
    where: { landingPageId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  const versions = await prisma.designVersion.findMany({
    where: { landingPageId: id },
    select: {
      id: true,
      version: true,
      widgetCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  })

  const data: VersionSummary[] = versions.map(v => ({
    ...v,
    isLatest: v.id === latestVersion?.id,
  }))

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
