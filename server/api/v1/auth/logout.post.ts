import { refreshTokenSchema } from '../../../../shared/schemas/auth.schema'
import { createAuditLog } from '../../../utils/audit'
import { extractTokenFromHeader, verifyAccessToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  // Get user from access token (optional, for audit)
  const accessToken = extractTokenFromHeader(event)
  const user = accessToken ? verifyAccessToken(accessToken) : null

  // Parse body for refresh token
  const body = await readBody(event)
  const result = refreshTokenSchema.safeParse(body)

  if (result.success) {
    const { refreshToken } = result.data

    // Revoke the refresh token
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  // Log logout
  if (user) {
    await createAuditLog(event, {
      userId: user.id,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: user.id,
    })
  }

  return { success: true }
})
