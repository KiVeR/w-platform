import type { H3Event } from 'h3'
import type { JwtPayload } from './jwt'
import { extractTokenFromHeader, verifyAccessToken } from './jwt'
import prisma from './prisma'

export interface AuthenticatedUser {
  id: number
  email: string
  role: string
}

/**
 * Extracts and verifies the user from the request token
 * Throws 401 if token is missing or invalid
 */
export async function requireAuth(event: H3Event): Promise<JwtPayload> {
  const token = extractTokenFromHeader(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Token requis',
    })
  }

  const payload = verifyAccessToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Token invalide ou expiré',
    })
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, isActive: true },
  })

  if (!user || !user.isActive) {
    throw createError({
      statusCode: 401,
      message: 'Utilisateur non trouvé ou désactivé',
    })
  }

  return payload
}
