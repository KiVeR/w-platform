import type {
  CampaignDraft,
  CampaignLogRow,
  CampaignRecipientStatus,
  LandingPageRow,
  LogActivityRow,
} from '@/types/campaign'

export const fakeCampaignDraft: CampaignDraft = {
  type: 'prospection',
  channel: 'sms',
  name: '',
  sender: '',
  message: '',
  targeting: { method: 'postcode', departments: [], postcodes: [], communes: [], iris_codes: [], address: null, lat: null, lng: null, radius: null },
  scheduled_at: null,
  landing_page_id: null,
  is_demo: false,
  additional_phone: null,
}

export const fakeLandingPage: LandingPageRow = {
  id: 1,
  name: 'Promo Été 2026',
  status: 'published',
  is_active: true,
  created_at: '2026-01-15T10:00:00Z',
}

export function fakeLandingPageList(count = 3): LandingPageRow[] {
  return Array.from({ length: count }, (_, i) => ({
    ...fakeLandingPage,
    id: i + 1,
    name: `Landing Page ${i + 1}`,
  }))
}

export const fakeUser = {
  id: 1,
  firstname: 'Jean',
  lastname: 'Dupont',
  full_name: 'Jean Dupont',
  email: 'jean@test.com',
  partner_id: 42,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  roles: ['partner' as const],
  permissions: ['view campaigns' as const, 'manage campaigns' as const],
}

export const fakeAdminUser = {
  ...fakeUser,
  id: 999,
  firstname: 'Admin',
  lastname: 'Wellpack',
  full_name: 'Admin Wellpack',
  email: 'admin@wellpack.fr',
  partner_id: null,
  roles: ['admin' as const],
  permissions: [
    'view partners' as const,
    'manage partners' as const,
    'view campaigns' as const,
    'manage campaigns' as const,
    'view shops' as const,
    'manage shops' as const,
    'view landing-pages' as const,
    'manage landing-pages' as const,
    'view targeting-templates' as const,
    'manage targeting-templates' as const,
    'view variable-schemas' as const,
    'manage variable-schemas' as const,
    'view ai-contents' as const,
    'manage ai-contents' as const,
  ],
}

export const fakeAdvUser = {
  ...fakeUser,
  id: 10,
  firstname: 'Alice',
  lastname: 'ADV',
  full_name: 'Alice ADV',
  email: 'alice@adv.fr',
  partner_id: null,
  roles: ['adv' as const],
  permissions: ['view partners' as const, 'view operations' as const, 'manage operations' as const, 'transition operations' as const],
}

export const fakePartner = {
  id: 42,
  name: 'Test Partner',
  is_active: true,
  euro_credits: '100.00',
}

export const fakeAuthResponse = {
  data: {
    access_token: 'access-123',
    token_type: 'Bearer',
    expires_in: '86400',
    refresh_token: 'refresh-456',
    user: fakeUser,
  },
}

export const fakeCampaign = {
  id: '1',
  partner_id: '42',
  user_id: '1',
  type: 'prospection',
  channel: 'sms',
  status: 'sent',
  is_demo: 'false',
  name: 'Promo ete 2026',
  targeting: '{"geo":{"postcodes":[{"code":"75001","volume":500}]}}',
  volume_estimated: '12450',
  volume_sent: '12200',
  message: 'Profitez de -20% cet ete !',
  sender: 'WELLPACK',
  additional_phone: null,
  sms_count: '1',
  short_url: 'https://wllp.co/abc123',
  scheduled_at: '2026-02-05T09:00:00Z',
  sent_at: '2026-02-05T09:02:00Z',
  unit_price: '0.045',
  total_price: '560.25',
  created_at: '2026-02-01T10:00:00Z',
}

export function fakeCampaignList(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    ...fakeCampaign,
    id: String(i + 1),
    name: `Campaign ${i + 1}`,
    status: ['draft', 'scheduled', 'sent'][i % 3],
  }))
}

export const fakePaginationMeta = {
  current_page: 1,
  from: 1,
  last_page: 3,
  links: [],
  path: '/api/campaigns',
  per_page: 15,
  to: 15,
  total: 42,
}

const recipientStatuses: CampaignRecipientStatus[] = [
  'QUEUED',
  'DISPATCHED',
  'DELIVERED',
  'UNDELIVERABLE',
  'FAILED',
  'REJECTED',
  'EXPIRED',
  'CANCELED',
]

export const fakeRecipient = {
  id: '1',
  campaign_id: '42',
  status: 'DELIVERED',
  phone_number: '+33612345678',
  message_preview: 'Profitez de -20% cet ete !',
  message_preview_length: '28',
  short_url_suffix: 'abc123',
  short_url_slug: 'promo-ete',
  short_url_click: '3',
  additional_information: null,
  stop_requested_at: null,
  delivered_at: '2026-02-05T09:05:00Z',
} satisfies Record<string, unknown>

export function fakeRecipientList(count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    ...fakeRecipient,
    id: String(i + 1),
    phone_number: `+336${String(i + 1).padStart(8, '0')}`,
    status: recipientStatuses[i % recipientStatuses.length],
  }))
}

export const fakeRecipientPaginationMeta = {
  current_page: 1,
  from: 1,
  last_page: 5,
  links: [],
  path: '/api/campaigns/42/recipients',
  per_page: 15,
  to: 15,
  total: 72,
}

export const fakeCampaignLog: CampaignLogRow & { id: string | number, campaign_id: string | number } = {
  id: '1',
  campaign_id: '42',
  data: { phase: 'routing', message: 'Routing started', level: 'info' },
  created_at: '2026-02-05T09:00:00Z',
}

export function fakeCampaignLogList(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    ...fakeCampaignLog,
    id: String(i + 1),
    created_at: `2026-02-05T09:0${i}:00Z`,
  }))
}

export const fakeLogActivity: LogActivityRow & { id: string | number, model_id: string | number } = {
  id: '1',
  event: 'updated',
  model_type: 'App\\Models\\Campaign',
  model_id: '42',
  old_values: { status: 'draft' },
  new_values: { status: 'scheduled' },
  created_at: '2026-02-04T15:00:00Z',
}

export function fakeLogActivityList(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    ...fakeLogActivity,
    id: String(i + 1),
    event: ['created', 'updated', 'deleted'][i % 3],
    created_at: `2026-02-05T09:0${i}:00Z`,
  }))
}
