import type { LoginResponse } from '../../../../shared/types/api'
import { registerSchema } from '../../../../shared/schemas/auth.schema'
import { createAuditLog } from '../../../utils/audit'
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiration,
} from '../../../utils/jwt'
import { hashPassword } from '../../../utils/password'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event): Promise<LoginResponse> => {
  // Parse and validate body
  const body = await readBody(event)
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Données invalides',
      data: result.error.flatten().fieldErrors,
    })
  }

  const { email, password, firstName, lastName } = result.data

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Cet email est déjà utilisé',
    })
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role: 'EDITOR', // Default role for new users
    },
  })

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

  // Log user creation
  await createAuditLog(event, {
    userId: user.id,
    action: 'USER_CREATED',
    entityType: 'USER',
    entityId: user.id,
  })

  return {
    accessToken,
    refreshToken,
    user: userPayload,
  }
})
