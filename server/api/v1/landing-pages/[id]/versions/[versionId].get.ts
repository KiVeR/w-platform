import { requireAuth, requireLandingPage, requirePermission } from '../../../../../utils/permissions'
import prisma from '../../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  const versionId = Number(getRouterParam(event, 'versionId'))

  if (Number.isNaN(id) || Number.isNaN(versionId)) {
    throw createError({
      statusCode: 400,
      message: 'ID invalide',
    })
  }

  await requireLandingPage(id)
  await requirePermission(user.id, id, 'VIEW')

  const version = await prisma.designVersion.findFirst({
    where: {
      id: versionId,
      landingPageId: id,
    },
  })

  if (!version) {
    throw createError({
      statusCode: 404,
      message: 'Version non trouvée',
    })
  }

  const latestVersion = await prisma.designVersion.findFirst({
    where: { landingPageId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  return {
    id: version.id,
    version: version.version,
    widgetCount: version.widgetCount,
    createdAt: version.createdAt,
    isLatest: version.id === latestVersion?.id,
    design: version.design,
  }
})
