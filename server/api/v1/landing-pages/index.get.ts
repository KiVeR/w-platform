import { paginationSchema } from '../../../../shared/schemas/landing-page.schema'
import { requireAuth } from '../../../utils/permissions'
import prisma from '../../../utils/prisma'

interface LandingPageListItem {
  id: number
  title: string
  slug: string
  status: string
  ownerId: number
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  owner: {
    id: number
    firstName: string | null
    lastName: string | null
  }
  _count: {
    designVersions: number
  }
}

interface PaginatedResponse {
  data: LandingPageListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default defineEventHandler(async (event): Promise<PaginatedResponse> => {
  // Require authentication
  const user = await requireAuth(event)

  // Parse and validate query params
  const query = getQuery(event)
  const result = paginationSchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Paramètres de pagination invalides',
      data: result.error.flatten(),
    })
  }

  const { page, limit, status, search, sortBy, sortOrder } = result.data

  // Build where clause: user owns the page OR has permission
  const whereClause = {
    OR: [
      { ownerId: user.id },
      {
        permissions: {
          some: {
            userId: user.id,
          },
        },
      },
    ],
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  // Get total count
  const total = await prisma.landingPage.count({
    where: whereClause,
  })

  // Get paginated data
  const data = await prisma.landingPage.findMany({
    where: whereClause,
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          designVersions: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  })

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
