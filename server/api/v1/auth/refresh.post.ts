import type { RefreshResponse } from '../../../../shared/types/api'
import {
  clearRefreshTokenCookie,
  getRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../../../utils/auth-cookie'
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiration,
  verifyRefreshToken,
} from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event): Promise<RefreshResponse> => {
  // Get refresh token from HttpOnly cookie
  const token = getRefreshTokenCookie(event)

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Refresh token requis',
    })
  }

  // Verify token signature
  const payload = verifyRefreshToken(token)

  if (!payload) {
    clearRefreshTokenCookie(event)
    throw createError({
      statusCode: 401,
      message: 'Refresh token invalide ou expiré',
    })
  }

  // Find token in DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    clearRefreshTokenCookie(event)
    throw createError({
      statusCode: 401,
      message: 'Refresh token invalide ou révoqué',
    })
  }

  if (!storedToken.user.isActive) {
    clearRefreshTokenCookie(event)
    throw createError({
      statusCode: 401,
      message: 'Compte désactivé',
    })
  }

  // Revoke old token (token rotation)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  })

  // Create new tokens
  const userPayload = {
    id: storedToken.user.id,
    email: storedToken.user.email,
    firstName: storedToken.user.firstName,
    lastName: storedToken.user.lastName,
    role: storedToken.user.role,
  }

  const newAccessToken = generateAccessToken(userPayload)
  const newRefreshToken = generateRefreshToken(userPayload)

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt: getRefreshTokenExpiration(),
    },
  })

  // Set new refresh token as HttpOnly cookie
  setRefreshTokenCookie(event, newRefreshToken)

  return {
    accessToken: newAccessToken,
  }
})
