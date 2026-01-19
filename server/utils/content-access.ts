import type { Campaign, Content, LandingPageData } from '@prisma/client'
import prisma from './prisma'

// Type for content with campaign relation
type ContentWithCampaign = Content & {
  campaign: Campaign
}

// Type for content with landing page data and campaign
type ContentWithLandingPageData = Content & {
  campaign: Campaign
  landingPageData: LandingPageData | null
}

/**
 * Verify content exists and user has access via campaign ownership.
 * Performs a single optimized query instead of two separate queries.
 *
 * Security: Uses 404 for both "not found" and "no access" to prevent information disclosure.
 *
 * @throws 400 if IDs are invalid
 * @throws 404 if content not found OR user doesn't have access (intentionally vague)
 */
export async function requireContentWithCampaignAccess(
  contentId: number,
  campaignId: number,
  userId: number,
): Promise<ContentWithCampaign> {
  // Validate IDs
  if (Number.isNaN(contentId) || contentId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de contenu invalide',
    })
  }

  if (Number.isNaN(campaignId) || campaignId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de campagne invalide',
    })
  }

  // Single optimized query with all conditions
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      campaignId,
      deletedAt: null, // Soft delete filter
      campaign: {
        ownerId: userId,
        deletedAt: null, // Campaign soft delete filter
      },
    },
    include: {
      campaign: true,
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
 * @throws 400 if IDs are invalid or content is not a landing page
 * @throws 404 if content not found OR user doesn't have access
 */
export async function requireLandingPageWithAccess(
  contentId: number,
  campaignId: number,
  userId: number,
): Promise<ContentWithLandingPageData> {
  // Validate IDs
  if (Number.isNaN(contentId) || contentId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de contenu invalide',
    })
  }

  if (Number.isNaN(campaignId) || campaignId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de campagne invalide',
    })
  }

  // Single optimized query
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      campaignId,
      deletedAt: null,
      campaign: {
        ownerId: userId,
        deletedAt: null,
      },
    },
    include: {
      campaign: true,
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

/**
 * Verify campaign exists and user has access (with soft delete filter).
 * This is an optimized version that filters soft-deleted campaigns.
 *
 * @throws 400 if ID is invalid
 * @throws 404 if campaign not found OR user doesn't have access
 */
export async function requireCampaignWithAccess(
  campaignId: number,
  userId: number,
): Promise<Campaign> {
  if (Number.isNaN(campaignId) || campaignId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'ID de campagne invalide',
    })
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      ownerId: userId,
      deletedAt: null,
    },
  })

  if (!campaign) {
    throw createError({
      statusCode: 404,
      message: 'Campagne non trouvée',
    })
  }

  return campaign
}
