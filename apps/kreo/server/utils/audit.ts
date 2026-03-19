import type { AuditAction, EntityType } from '@prisma/client'
import type { H3Event } from 'h3'
import prisma from './prisma'

interface AuditLogInput {
  userId?: number | null
  action: AuditAction
  entityType: EntityType
  entityId?: number | null
  details?: Record<string, unknown>
}

export async function createAuditLog(
  event: H3Event,
  input: AuditLogInput,
): Promise<void> {
  const ipAddress = getHeader(event, 'x-forwarded-for')
    || getHeader(event, 'x-real-ip')
    || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || null

  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      details: input.details as object | undefined,
      ipAddress,
      userAgent,
    },
  })
}

// Alias for convenience
export const logAudit = createAuditLog
