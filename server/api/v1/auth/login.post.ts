import type { LoginResponse } from '../../../../shared/types/api'
import { loginSchema } from '../../../../shared/schemas/auth.schema'
import { createAuditLog } from '../../../utils/audit'
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiration,
} from '../../../utils/jwt'
import { verifyPassword } from '../../../utils/password'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event): Promise<LoginResponse> => {
  // Parse and validate body
  const body = await readBody(event)
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten().fieldErrors,
    })
  }

  const { email, password } = result.data

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user || !user.isActive) {
    // Log failed attempt
    await createAuditLog(event, {
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      details: { email, reason: 'user_not_found' },
    })

    throw createError({
      statusCode: 401,
      message: 'Email ou mot de passe incorrect',
    })
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.password)

  if (!validPassword) {
    await createAuditLog(event, {
      userId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: user.id,
      details: { reason: 'invalid_password' },
    })

    throw createError({
      statusCode: 401,
      message: 'Email ou mot de passe incorrect',
    })
  }

  // Create user payload for token
  const userPayload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  }

  // Generate tokens
  const accessToken = generateAccessToken(userPayload)
  const refreshToken = generateRefreshToken(userPayload)

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiration(),
    },
  })

  // Log successful login
  await createAuditLog(event, {
    userId: user.id,
    action: 'LOGIN',
    entityType: 'USER',
    entityId: user.id,
  })

  return {
    accessToken,
    refreshToken,
    user: userPayload,
  }
})
