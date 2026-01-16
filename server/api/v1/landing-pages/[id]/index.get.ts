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
  await requireLandingPage(id)

  // Check permission (VIEW or higher)
  await requirePermission(user.id, id, 'VIEW')

  // Get landing page with latest design
  const landingPage = await prisma.landingPage.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      designVersions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          version: true,
          widgetCount: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          assets: true,
          designVersions: true,
        },
      },
    },
  })

  return {
    ...landingPage,
    latestDesign: landingPage?.designVersions[0] || null,
    designVersions: undefined, // Remove array, keep only latest
  }
})
