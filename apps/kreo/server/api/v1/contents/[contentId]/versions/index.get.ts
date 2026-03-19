import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const contentId = Number(getRouterParam(event, 'contentId'))

  // Single optimized query for access check
  const content = await requireLandingPageWithAccess(contentId, user.id)

  if (!content.landingPageData) {
    return {
      versions: [],
      pagination: { total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 0 },
      rateLimit: formatRateLimitForResponse(getRateLimitStatus(user.id, RATE_LIMITS.VERSION_RESTORE)),
    }
  }

  // Parse query params
  const query = getQuery(event)
  const { page, pageSize } = querySchema.parse(query)

  // Get total count
  const total = await prisma.contentDesignVersion.count({
    where: { landingPageDataId: content.landingPageData.id },
  })

  // Get versions with pagination
  const versions = await prisma.contentDesignVersion.findMany({
    where: { landingPageDataId: content.landingPageData.id },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      version: true,
      widgetCount: true,
      createdAt: true,
    },
  })

  // Mark the first one as current (most recent)
  const versionsWithCurrent = versions.map((v, index) => ({
    ...v,
    isCurrent: page === 1 && index === 0,
  }))

  // Get rate limit status for restore action
  const rateLimitStatus = getRateLimitStatus(user.id, RATE_LIMITS.VERSION_RESTORE)

  return {
    versions: versionsWithCurrent,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    rateLimit: formatRateLimitForResponse(rateLimitStatus),
  }
})
