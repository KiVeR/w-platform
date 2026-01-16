import type { Permission } from '@prisma/client'
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

/**
 * Permission hierarchy: MANAGE > EDIT > VIEW
 */
const permissionHierarchy: Record<Permission, number> = {
  VIEW: 1,
  EDIT: 2,
  MANAGE: 3,
}

/**
 * Check if user has required permission on a landing page
 * Returns true if user is owner OR has required permission level
 */
export async function checkPermission(
  userId: number,
  landingPageId: number,
  requiredPermission: Permission,
): Promise<boolean> {
  // Check if user is owner
  const landingPage = await prisma.landingPage.findUnique({
    where: { id: landingPageId },
    select: { ownerId: true },
  })

  if (!landingPage) {
    return false
  }

  // Owner has all permissions
  if (landingPage.ownerId === userId) {
    return true
  }

  // Check explicit permission
  const permission = await prisma.userPermission.findUnique({
    where: {
      userId_landingPageId: {
        userId,
        landingPageId,
      },
    },
  })

  if (!permission) {
    return false
  }

  // Check permission hierarchy
  return permissionHierarchy[permission.permission] >= permissionHierarchy[requiredPermission]
}

/**
 * Require permission or throw 403
 */
export async function requirePermission(
  userId: number,
  landingPageId: number,
  requiredPermission: Permission,
): Promise<void> {
  const hasPermission = await checkPermission(userId, landingPageId, requiredPermission)

  if (!hasPermission) {
    throw createError({
      statusCode: 403,
      message: 'Permission insuffisante',
    })
  }
}

/**
 * Get landing page and verify it exists, throw 404 if not found
 */
export async function requireLandingPage(landingPageId: number) {
  const landingPage = await prisma.landingPage.findUnique({
    where: { id: landingPageId },
  })

  if (!landingPage) {
    throw createError({
      statusCode: 404,
      message: 'Landing page non trouvée',
    })
  }

  return landingPage
}
