import { createLandingPageSchema } from '../../../../shared/schemas/landing-page.schema'
import { createAuditLog } from '../../../utils/audit'
import { requireAuth } from '../../../utils/permissions'
import prisma from '../../../utils/prisma'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (await prisma.landingPage.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  // Parse and validate body
  const body = await readBody(event)
  const result = createLandingPageSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { title, slug: providedSlug } = result.data

  // Generate or validate slug
  const baseSlug = providedSlug || generateSlug(title)
  const slug = await ensureUniqueSlug(baseSlug)

  // Create landing page
  const landingPage = await prisma.landingPage.create({
    data: {
      title,
      slug,
      ownerId: user.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // Create initial empty design version
  await prisma.designVersion.create({
    data: {
      landingPageId: landingPage.id,
      version: '1.0',
      design: {
        widgets: [],
        globalStyles: {
          backgroundColor: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          maxWidth: 430,
        },
      },
      widgetCount: 0,
    },
  })

  // Audit log
  await createAuditLog(event, {
    userId: user.id,
    action: 'PAGE_CREATED',
    entityType: 'LANDING_PAGE',
    entityId: landingPage.id,
    details: { title, slug },
  })

  return landingPage
})
