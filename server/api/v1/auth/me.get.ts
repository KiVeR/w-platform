import type { UserPublic } from '../../../../shared/types/user'
import { extractTokenFromHeader, verifyAccessToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event): Promise<UserPublic> => {
  // Extract token
  const token = extractTokenFromHeader(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Token requis',
    })
  }

  // Verify token
  const payload = verifyAccessToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Token invalide ou expiré',
    })
  }

  // Get fresh user data from DB
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    throw createError({
      statusCode: 401,
      message: 'Utilisateur non trouvé ou désactivé',
    })
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  }
})
