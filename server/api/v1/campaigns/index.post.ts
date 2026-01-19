import { createCampaignSchema } from '../../../../shared/schemas/campaign.schema'
import { findPrimaryContentId, generateContentTitle, getDefaultLandingPageDesign } from '../../../services/content.service'
import { toApiContentType, toApiContentTypes, toPrismaContentType, toPrismaContentTypes } from '../../../utils/content-type-mapper'
import { requireAuth } from '../../../utils/permissions'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody(event)
  const result = createCampaignSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { title, description, enabledContentTypes } = result.data

  // Use transaction to create campaign and contents atomically
  const campaign = await prisma.$transaction(async (tx) => {
    // 1. Create the campaign
    const newCampaign = await tx.campaign.create({
      data: {
        title,
        description: description || null,
        enabledContentTypes: toPrismaContentTypes(enabledContentTypes),
        ownerId: user.id,
      },
    })

    // 2. Create contents for each enabled type
    for (const contentType of enabledContentTypes) {
      const contentTitle = generateContentTitle(title, contentType)
      const prismaType = toPrismaContentType(contentType)

      await tx.content.create({
        data: {
          type: prismaType,
          campaignId: newCampaign.id,
          title: contentTitle,
          // Create type-specific data
          ...(contentType === 'landing-page' && {
            landingPageData: {
              create: {
                design: getDefaultLandingPageDesign(),
              },
            },
          }),
          ...(contentType === 'rcs' && {
            rcsData: {
              create: {
                message: null,
              },
            },
          }),
          ...(contentType === 'sms' && {
            smsData: {
              create: {
                message: null,
              },
            },
          }),
        },
      })
    }

    // 3. Return campaign with contents
    return tx.campaign.findUnique({
      where: { id: newCampaign.id },
      include: {
        contents: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            contents: true,
          },
        },
      },
    })
  })

  if (!campaign) {
    throw createError({
      statusCode: 500,
      message: 'Erreur lors de la création de la campagne',
    })
  }

  // Find primary content for redirect
  const primaryContentId = findPrimaryContentId(campaign.contents)

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    enabledContentTypes: toApiContentTypes(campaign.enabledContentTypes),
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    _count: campaign._count,
    primaryContentId,
    contents: campaign.contents.map(content => ({
      id: content.id,
      type: toApiContentType(content.type),
      title: content.title,
      status: content.status,
    })),
  }
})
