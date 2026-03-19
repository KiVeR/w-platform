import type { ContentListItem, RecentContentsResponse } from '#shared/types/content'
import { FAVORITES_LIMIT, RECENT_CONTENTS_LIMIT } from '#shared/constants/content'

export default defineEventHandler(async (event): Promise<RecentContentsResponse> => {
  const user = await requireAuth(event)

  const [recentContents, favoriteContents] = await Promise.all([
    prisma.content.findMany({
      where: {
        ownerId: user.id,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: RECENT_CONTENTS_LIMIT,
    }),
    prisma.content.findMany({
      where: {
        ownerId: user.id,
        deletedAt: null,
        isFavorite: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: FAVORITES_LIMIT,
    }),
  ])

  const mapContent = (content: typeof recentContents[0]): ContentListItem => ({
    id: content.id,
    type: toApiContentType(content.type),
    title: content.title,
    status: content.status,
    isFavorite: content.isFavorite,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  })

  return {
    recent: recentContents.map(mapContent),
    favorites: favoriteContents.map(mapContent),
  }
})
