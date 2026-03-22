import type { ContentType } from '#shared/types/content'
import { z } from 'zod'

const createContentSchema = z.object({
  type: z.enum(['landing-page', 'rcs', 'sms']),
  title: z.string().min(1).max(255).default('Nouveau contenu'),
})

interface CreateContentResponse {
  id: number
  type: ContentType
  title: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export default defineEventHandler(async (event): Promise<CreateContentResponse> => {
  const user = await requireAuth(event)

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
  const prismaContentType = toPrismaContentType(type as ContentType)

  const content = await prisma.content.create({
    data: {
      type: prismaContentType,
      title,
      ownerId: user.id,
      status: 'DRAFT',
      ...(prismaContentType === 'LANDING_PAGE' && {
        landingPageData: {
          create: {
            design: {
              widgets: [],
              globalStyles: {
                backgroundColor: '#ffffff',
                fontFamily: 'Inter, sans-serif',
              },
            },
          },
        },
      }),
      ...(prismaContentType === 'RCS' && {
        rcsData: {
          create: {
            message: null,
          },
        },
      }),
      ...(prismaContentType === 'SMS' && {
        smsData: {
          create: {
            message: null,
          },
        },
      }),
    },
  })

  await createAuditLog(event, {
    action: 'CONTENT_CREATED',
    entityType: 'CONTENT',
    entityId: content.id,
    details: { type, title },
  })

  return {
    id: content.id,
    type: toApiContentType(content.type),
    title: content.title,
    status: content.status,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  }
})
