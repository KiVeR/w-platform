import type { ShortUrl } from '@/types/shortUrl'
import type { ShortUrlRow } from '@/types/shortUrl'

export function mapShortUrlToRow(raw: Record<string, unknown>): ShortUrlRow {
  return {
    id: Number(raw.id),
    slug: String(raw.slug ?? ''),
    link: raw.link ? String(raw.link) : null,
    clickCount: Number(raw.click_count ?? 0),
    clickCountBots: Number(raw.click_count_bots ?? 0),
    isDraft: raw.is_draft === 'true' || raw.is_draft === true,
    isEnabled: raw.is_enabled === 'true' || raw.is_enabled === true,
    isTraceable: raw.is_traceable_by_recipient === 'true' || raw.is_traceable_by_recipient === true,
    importId: raw.import_id ? String(raw.import_id) : null,
  }
}

export function mapShortUrl(raw: Record<string, unknown>): ShortUrl {
  return {
    id: Number(raw.id),
    slug: String(raw.slug ?? ''),
    link: raw.link ? String(raw.link) : null,
    click_count: Number(raw.click_count ?? 0),
    click_count_bots: Number(raw.click_count_bots ?? 0),
    is_draft: raw.is_draft === 'true' || raw.is_draft === true,
    is_enabled: raw.is_enabled === 'true' || raw.is_enabled === true,
    is_traceable_by_recipient: raw.is_traceable_by_recipient === 'true' || raw.is_traceable_by_recipient === true,
    import_id: raw.import_id ? String(raw.import_id) : null,
  }
}
