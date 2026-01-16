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

  // Check permission (MANAGE required for delete)
  await requirePermission(user.id, id, 'MANAGE')

  // Get query param for hard/soft delete
  const query = getQuery(event)
  const hardDelete = query.hard === 'true'

  if (hardDelete) {
    // Hard delete - cascades to design versions, assets, permissions
    await prisma.landingPage.delete({
      where: { id },
    })
  }
  else {
    // Soft delete - archive the page
    await prisma.landingPage.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  // Audit log
  await createAuditLog(event, {
    userId: user.id,
    action: 'PAGE_DELETED',
    entityType: 'LANDING_PAGE',
    entityId: id,
    details: {
      title: existingPage.title,
      slug: existingPage.slug,
      hardDelete,
    },
  })

  return {
    success: true,
    message: hardDelete ? 'Page supprimée définitivement' : 'Page archivée',
  }
})
