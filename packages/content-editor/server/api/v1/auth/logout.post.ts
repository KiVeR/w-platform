export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  // Get user from access token (optional, for audit)
  const accessToken = extractTokenFromHeader(event)
  const user = accessToken ? verifyAccessToken(accessToken) : null

  // Get refresh token from HttpOnly cookie
  const refreshToken = getRefreshTokenCookie(event)

  if (refreshToken) {
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

  // Clear the refresh token cookie
  clearRefreshTokenCookie(event)

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
