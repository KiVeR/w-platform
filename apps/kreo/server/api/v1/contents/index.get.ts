import type { ContentListItem, ContentsListResponse, ContentType } from '#shared/types/content'
import { contentPaginationSchema } from '#shared/schemas/content.schema'
import { z } from 'zod'

// Extend base schema with favorites filter
const contentsQuerySchema = contentPaginationSchema.extend({
  favorites: z.coerce.boolean().optional(),
})

export default defineEventHandler(async (event): Promise<ContentsListResponse> => {
  const user = await requireAuth(event)

  const query = getQuery(event)
  const result = contentsQuerySchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Paramètres de pagination invalides',
      data: result.error.flatten(),
    })
  }

  const { page, limit, type, status, search, sortBy, sortOrder, favorites } = result.data

  const whereClause: Record<string, unknown> = {
    ownerId: user.id,
    deletedAt: null,
    ...(type && { type: toPrismaContentType(type as ContentType) }),
    ...(status && { status }),
    ...(favorites && { isFavorite: true }),
    ...(search && {
      title: { contains: search, mode: 'insensitive' as const },
    }),
  }

  const total = await prisma.content.count({ where: whereClause })

  const contents = await prisma.content.findMany({
    where: whereClause,
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  })

  const data: ContentListItem[] = contents.map(content => ({
    id: content.id,
    type: toApiContentType(content.type),
    title: content.title,
    status: content.status,
    isFavorite: content.isFavorite,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  }))

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
