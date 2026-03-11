import { describe, expect, test } from 'vitest'
import { AlertCircle, Calendar, Clock, Pencil, Plus, Send } from 'lucide-vue-next'
import type { LogActivityRow } from '@/types/campaign'
import { formatActivity, formatStatusLabel, getChangedFields } from '@/utils/activityFormatter'

const messages: Record<string, string> = {
  'campaigns.detail.timeline.events.created': 'Campaign created',
  'campaigns.detail.timeline.events.deleted': 'Campaign deleted',
  'campaigns.detail.timeline.events.updated': 'Campaign updated',
  'campaigns.detail.timeline.events.statusChanged': 'Status updated from {from} to {to}',
  'campaigns.detail.timeline.events.messageUpdated': 'Message updated',
  'campaigns.detail.timeline.events.scheduledAtUpdated': 'Scheduled for {date}',
  'campaigns.detail.timeline.events.fieldsUpdated': 'Fields updated: {fields}',
  'campaigns.detail.timeline.status.draft': 'Draft',
  'campaigns.detail.timeline.status.scheduled': 'Scheduled',
  'campaigns.detail.timeline.fields.sender': 'Sender',
}

function t(key: string, params?: Record<string, unknown>): string {
  let value = messages[key] ?? key

  for (const [param, replacement] of Object.entries(params ?? {})) {
    value = value.replaceAll(`{${param}}`, String(replacement))
  }

  return value
}

function activity(overrides: Partial<LogActivityRow>): LogActivityRow {
  return {
    id: 1,
    event: 'updated',
    model_type: 'App\\Models\\Campaign',
    model_id: 42,
    old_values: null,
    new_values: null,
    created_at: '2026-02-05T09:00:00Z',
    ...overrides,
  }
}

describe('formatActivity', () => {
  test('humanise un event created', () => {
    const result = formatActivity(activity({ event: 'created' }), t)

    expect(result.icon).toBe(Plus)
    expect(result.tone).toBe('success')
    expect(result.description).toBe('Campaign created')
  })

  test('humanise un changement de statut', () => {
    const result = formatActivity(activity({
      old_values: { status: 'draft' },
      new_values: { status: 'scheduled' },
    }), t)

    expect(result.icon).toBe(Send)
    expect(result.description).toBe('Status updated from Draft to Scheduled')
  })

  test('humanise un changement de message', () => {
    const result = formatActivity(activity({
      old_values: { message: 'Avant' },
      new_values: { message: 'Apres' },
    }), t)

    expect(result.icon).toBe(Pencil)
    expect(result.description).toBe('Message updated')
  })

  test('humanise un changement de date de planification', () => {
    const result = formatActivity(activity({
      old_values: { scheduled_at: null },
      new_values: { scheduled_at: '2026-02-05T09:00:00Z' },
    }), t)

    expect(result.icon).toBe(Calendar)
    expect(result.description).toContain('Scheduled for')
  })

  test('fallback sur un event inconnu', () => {
    const result = formatActivity(activity({ event: 'refreshed' }), t)

    expect(result.icon).toBe(Clock)
    expect(result.tone).toBe('neutral')
    expect(result.description).toBe('Refreshed')
  })

  test('humanise un event deleted', () => {
    const result = formatActivity(activity({ event: 'deleted' }), t)

    expect(result.icon).toBe(AlertCircle)
    expect(result.tone).toBe('danger')
    expect(result.description).toBe('Campaign deleted')
  })
})

describe('formatStatusLabel', () => {
  test('mappe les statuts connus et fallback les autres', () => {
    expect(formatStatusLabel('draft', t)).toBe('Draft')
    expect(formatStatusLabel('QUERY_PENDING', t)).toBe('Query Pending')
  })
})

describe('getChangedFields', () => {
  test('extrait les champs modifies depuis old_values et new_values', () => {
    expect(getChangedFields(activity({
      old_values: { status: 'draft', sender: 'A' },
      new_values: { status: 'scheduled', sender: 'A', message: 'Hello' },
    }))).toEqual(['status', 'message'])
  })
})
