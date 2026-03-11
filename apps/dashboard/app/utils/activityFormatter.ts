import type { Component } from 'vue'
import { AlertCircle, Calendar, Clock, Pencil, Plus, Send } from 'lucide-vue-next'
import type { LogActivityRow } from '@/types/campaign'
import { formatDateTime } from '@/utils/format'

export type ActivityTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

export interface FormattedActivity {
  icon: Component
  tone: ActivityTone
  description: string
  detail: string | null
  changedFields: string[]
}

type Translate = (key: string, params?: Record<string, unknown>) => string

function translateOrFallback(
  t: Translate,
  key: string,
  fallback: string,
  params?: Record<string, unknown>,
): string {
  const translated = t(key, params)
  return translated === key ? fallback : translated
}

function humanizeToken(value: string): string {
  return value
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function formatFieldLabel(field: string, t: Translate): string {
  return translateOrFallback(
    t,
    `campaigns.detail.timeline.fields.${field}`,
    humanizeToken(field),
  )
}

function stringifyDetail(activity: LogActivityRow): string | null {
  if (!activity.old_values && !activity.new_values) {
    return null
  }

  return JSON.stringify({
    before: activity.old_values ?? {},
    after: activity.new_values ?? {},
  }, null, 2)
}

export function getChangedFields(activity: LogActivityRow): string[] {
  const previous = activity.old_values ?? {}
  const next = activity.new_values ?? {}
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])

  return Array.from(keys).filter((key) => {
    return JSON.stringify(previous[key]) !== JSON.stringify(next[key])
  })
}

export function formatStatusLabel(status: string, t: Translate): string {
  return translateOrFallback(
    t,
    `campaigns.detail.timeline.status.${status}`,
    humanizeToken(status),
  )
}

export function formatActivity(activity: LogActivityRow, t: Translate): FormattedActivity {
  const changedFields = getChangedFields(activity)
  const detail = stringifyDetail(activity)

  if (activity.event === 'created') {
    return {
      icon: Plus,
      tone: 'success',
      description: translateOrFallback(
        t,
        'campaigns.detail.timeline.events.created',
        'Campagne creee',
      ),
      detail,
      changedFields,
    }
  }

  if (activity.event === 'deleted') {
    return {
      icon: AlertCircle,
      tone: 'danger',
      description: translateOrFallback(
        t,
        'campaigns.detail.timeline.events.deleted',
        'Campagne supprimee',
      ),
      detail,
      changedFields,
    }
  }

  if (activity.event === 'updated') {
    const statusField = ['status', 'routing_status'].find(field => changedFields.includes(field))

    if (statusField) {
      const previousStatus = activity.old_values?.[statusField]
      const nextStatus = activity.new_values?.[statusField]

      if (typeof previousStatus === 'string' && typeof nextStatus === 'string') {
        return {
          icon: Send,
          tone: 'info',
          description: translateOrFallback(
            t,
            'campaigns.detail.timeline.events.statusChanged',
            `Statut passe de ${formatStatusLabel(previousStatus, t)} a ${formatStatusLabel(nextStatus, t)}`,
            {
              from: formatStatusLabel(previousStatus, t),
              to: formatStatusLabel(nextStatus, t),
            },
          ),
          detail,
          changedFields,
        }
      }
    }

    if (changedFields.includes('scheduled_at')) {
      const scheduledAt = activity.new_values?.scheduled_at
      const formattedDate = typeof scheduledAt === 'string'
        ? formatDateTime(scheduledAt)
        : formatFieldLabel('scheduled_at', t)

      return {
        icon: Calendar,
        tone: 'warning',
        description: translateOrFallback(
          t,
          'campaigns.detail.timeline.events.scheduledAtUpdated',
          `Planifiee pour ${formattedDate}`,
          { date: formattedDate },
        ),
        detail,
        changedFields,
      }
    }

    if (changedFields.includes('message')) {
      return {
        icon: Pencil,
        tone: 'info',
        description: translateOrFallback(
          t,
          'campaigns.detail.timeline.events.messageUpdated',
          'Message modifie',
        ),
        detail,
        changedFields,
      }
    }

    if (changedFields.includes('sender')) {
      return {
        icon: Pencil,
        tone: 'info',
        description: translateOrFallback(
          t,
          'campaigns.detail.timeline.events.senderUpdated',
          'Expediteur modifie',
        ),
        detail,
        changedFields,
      }
    }

    if (changedFields.includes('targeting')) {
      return {
        icon: Pencil,
        tone: 'info',
        description: translateOrFallback(
          t,
          'campaigns.detail.timeline.events.targetingUpdated',
          'Ciblage modifie',
        ),
        detail,
        changedFields,
      }
    }

    if (changedFields.length > 0) {
      const fields = changedFields.map(field => formatFieldLabel(field, t)).join(', ')

      return {
        icon: Pencil,
        tone: 'info',
        description: translateOrFallback(
          t,
          'campaigns.detail.timeline.events.fieldsUpdated',
          `Champs mis a jour : ${fields}`,
          { fields },
        ),
        detail,
        changedFields,
      }
    }

    return {
      icon: Pencil,
      tone: 'info',
      description: translateOrFallback(
        t,
        'campaigns.detail.timeline.events.updated',
        'Campagne mise a jour',
      ),
      detail,
      changedFields,
    }
  }

  return {
    icon: Clock,
    tone: 'neutral',
    description: translateOrFallback(
      t,
      'campaigns.detail.timeline.events.generic',
      humanizeToken(activity.event),
      { event: humanizeToken(activity.event) },
    ),
    detail,
    changedFields,
  }
}
