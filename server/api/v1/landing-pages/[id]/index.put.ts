import { updateLandingPageSchema } from '../../../../../shared/schemas/landing-page.schema'
import { createAuditLog } from '../../../../utils/audit'
import { requireAuth, requireLandingPage, requirePermission } from '../../../../utils/permissions'
import prisma from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  // Get landing page ID from route params
  const id = Number(getRouterParam(event, 'id'))

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'ID invalide',
    })
  }

  // Verify landing page exists
  const existingPage = await requireLandingPage(id)

  // Check permission (EDIT or higher)
  await requirePermission(user.id, id, 'EDIT')

  // Parse and validate body
  const body = await readBody(event)
  const result = updateLandingPageSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten(),
    })
  }

  const { title, slug, status } = result.data

  // Check slug uniqueness if changed
  if (slug && slug !== existingPage.slug) {
    const existingSlug = await prisma.landingPage.findUnique({
      where: { slug },
    })

    if (existingSlug) {
      throw createError({
        statusCode: 409,
        message: 'Ce slug est déjà utilisé',
      })
    }
  }

  // Prepare update data
  const updateData: Record<string, unknown> = {}
  if (title !== undefined)
    updateData.title = title
  if (slug !== undefined)
    updateData.slug = slug
  if (status !== undefined) {
    updateData.status = status
    if (status === 'PUBLISHED' && !existingPage.publishedAt) {
      updateData.publishedAt = new Date()
    }
  }

  // Update landing page
  const landingPage = await prisma.landingPage.update({
    where: { id },
    data: updateData,
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

  // Audit log
  await createAuditLog(event, {
    userId: user.id,
    action: 'PAGE_UPDATED',
    entityType: 'LANDING_PAGE',
    entityId: id,
    details: { changes: updateData },
  })

  return landingPage
})
