import type { AuthUser } from '#shared/types/user'
import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'

export interface JwtPayload extends AuthUser {
  iat: number
  exp: number
}

export function generateAccessToken(user: AuthUser): string {
  const config = useRuntimeConfig()
  return jwt.sign(user, config.jwtSecret, {
    expiresIn: (config.jwtAccessExpiration as string) || '15m',
  })
}

export function generateRefreshToken(user: AuthUser): string {
  const config = useRuntimeConfig()
  return jwt.sign(user, config.jwtRefreshSecret, {
    expiresIn: '7d',
  })
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as JwtPayload
  }
  catch {
    return null
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload
  }
  catch {
    return null
  }
}

export function extractTokenFromHeader(event: H3Event): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

export function getRefreshTokenExpiration(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
}
