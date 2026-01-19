import { createContentSchema } from '#shared/schemas/content.schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const campaignId = Number(getRouterParam(event, 'id'))

  const campaign = await requireCampaignWithAccess(campaignId, user.id)

  const body = await readBody(event)
  const result = createContentSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { type, title } = result.data
  const prismaType = toPrismaContentType(type)

  // Check if this content type is enabled for the campaign
  if (!campaign.enabledContentTypes.includes(prismaType)) {
    throw createError({
      statusCode: 400,
      message: `Le type de contenu "${type}" n'est pas activé pour cette campagne`,
    })
  }

  // Create content with type-specific data
  const content = await prisma.content.create({
    data: {
      type: prismaType,
      campaignId,
      title,
      ...(type === 'landing-page' && {
        landingPageData: {
          create: {
            design: {
              version: '1.0',
              globalStyles: {
                palette: 'turquoise',
                backgroundColor: '#ffffff',
                textColor: '#1e293b',
                primaryColor: '#14b8a6',
                secondaryColor: '#0d9488',
                fontFamily: 'Inter, system-ui, sans-serif',
                headingFontFamily: 'Inter, system-ui, sans-serif',
                baseFontSize: '16px',
                lineHeight: '1.6',
                contentPadding: '16px',
                widgetGap: '12px',
                borderRadius: '8px',
                pageTitle: '',
                metaDescription: '',
              },
              widgets: [],
            },
          },
        },
      }),
      ...(type === 'rcs' && {
        rcsData: {
          create: {
            message: null,
          },
        },
      }),
      ...(type === 'sms' && {
        smsData: {
          create: {
            message: null,
          },
        },
      }),
    },
  })

  return {
    id: content.id,
    type: toApiContentType(content.type),
    campaignId: content.campaignId,
    title: content.title,
    status: content.status,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  }
})
