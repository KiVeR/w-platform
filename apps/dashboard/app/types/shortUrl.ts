export interface ShortUrl {
  id: number
  slug: string
  link: string | null
  click_count: number
  click_count_bots: number
  is_draft: boolean
  import_id: string | null
  is_traceable_by_recipient: boolean
  is_enabled: boolean
}

export interface ShortUrlRow {
  id: number
  slug: string
  link: string | null
  clickCount: number
  clickCountBots: number
  isDraft: boolean
  isEnabled: boolean
  isTraceable: boolean
  importId: string | null
}

export interface ShortUrlFilters {
  search: string
  isEnabled: 'all' | 'true' | 'false'
}

export interface ShortUrlPagination {
  page: number
  lastPage: number
  total: number
}
