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

  // Get query param for specific version
  const query = getQuery(event)
  const versionId = query.versionId ? Number(query.versionId) : null

  let designVersion

  if (versionId) {
    // Get specific version
    designVersion = await prisma.designVersion.findFirst({
      where: {
        id: versionId,
        landingPageId: id,
      },
    })

    if (!designVersion) {
      throw createError({
        statusCode: 404,
        message: 'Version non trouvée',
      })
    }
  }
  else {
    // Get latest version
    designVersion = await prisma.designVersion.findFirst({
      where: { landingPageId: id },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (!designVersion) {
    // Return empty design if no version exists
    return {
      id: null,
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
      createdAt: null,
    }
  }

  return {
    id: designVersion.id,
    version: designVersion.version,
    design: designVersion.design,
    widgetCount: designVersion.widgetCount,
    createdAt: designVersion.createdAt,
  }
})
