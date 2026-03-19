import type { Content, LandingPageData } from '@prisma/client'
import prisma from './prisma'

// Type for content with landing page data
type ContentWithLandingPageData = Content & {
  landingPageData: LandingPageData | null
}

/**
 * Verify content exists and user has access via ownership.
 * Performs a single optimized query.
 *
 * Security: Uses 404 for both "not found" and "no access" to prevent information disclosure.
 *
 * @throws 400 if ID is invalid
 * @throws 404 if content not found OR user doesn't have access (intentionally vague)
 */
export async function requireContentWithAccess(
  contentId: number,
  userId: number,
): Promise<Content> {
  // Validate ID
  if (Number.isNaN(contentId) || contentId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de contenu invalide',
    })
  }

  // Single optimized query with all conditions
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      ownerId: userId,
      deletedAt: null, // Soft delete filter
    },
  })

  // Return 404 for any access failure (security: don't reveal existence)
  if (!content) {
    throw createError({
      statusCode: 404,
      message: 'Contenu non trouvé',
    })
  }

  return content
}

/**
 * Verify landing page content exists and user has access.
 * Includes landing page data in the response.
 *
 * @throws 400 if ID is invalid or content is not a landing page
 * @throws 404 if content not found OR user doesn't have access
 */
export async function requireLandingPageWithAccess(
  contentId: number,
  userId: number,
): Promise<ContentWithLandingPageData> {
  if (Number.isNaN(contentId) || contentId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de contenu invalide',
    })
  }

  // Single optimized query
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      ownerId: userId,
      deletedAt: null,
    },
    include: {
      landingPageData: true,
    },
  })

  if (!content) {
    throw createError({
      statusCode: 404,
      message: 'Contenu non trouvé',
    })
  }

  // Validate content type
  if (content.type !== 'LANDING_PAGE') {
    throw createError({
      statusCode: 400,
      message: 'Ce type de contenu n\'a pas de design',
    })
  }

  return content
}
