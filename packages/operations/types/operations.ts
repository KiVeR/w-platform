export type LifecycleStatus = 'draft' | 'preparing' | 'on_hold' | 'ready' | 'scheduled' | 'processing' | 'delivered' | 'completed' | 'cancelled'
export type OperationType = 'loc' | 'fid' | 'rloc' | 'acq' | 'qual' | 'rep' | 'enrich' | 'valid' | 'filtre'
export type CreativeStatus = 'not_applicable' | 'pending' | 'in_progress' | 'pending_approval' | 'revision_requested' | 'approved'
export type BillingStatus = 'not_applicable' | 'pending' | 'invoiced' | 'paid' | 'credited' | 'prepaid'
export type RoutingStatus = 'not_applicable' | 'pending' | 'in_progress' | 'completed' | 'failed'
export type Priority = 'high' | 'medium' | 'low'

export interface OperationRow {
  id: number
  demande_id: number
  ref_operation: string
  line_number: number
  type: OperationType
  name: string
  advertiser: string | null
  priority: Priority | null
  lifecycle_status: LifecycleStatus
  creative_status: CreativeStatus
  billing_status: BillingStatus
  routing_status: RoutingStatus
  volume_estimated: number | null
  volume_sent: number | null
  unit_price: number | null
  total_price: number | null
  assigned_to: number | null
  scheduled_at: string | null
  delivered_at: string | null
  created_at: string
}

export interface OperationDetail extends OperationRow {
  hold_reason: string | null
  preparation_step: string | null
  processing_status: string | null
  cancellation_type: string | null
  targeting: Record<string, unknown> | null
  message: string | null
  sender: string | null
  external_ref: string | null
  demande?: { id: number; ref_demande: string; partner_id: number; partner?: { id: number; name: string } }
  campaign?: { id: number; name: string; status: string } | null
  assigned_user?: { id: number; full_name: string } | null
}

export interface OperationTransition {
  id: number
  operation_id: number
  track: string
  from_state: string
  to_state: string
  user_id: number | null
  reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user?: { id: number; full_name: string } | null
}

export interface OperationFilters {
  lifecycle_status?: LifecycleStatus
  type?: OperationType
  assigned_to?: number
  demande_id?: number
  search?: string
}

export interface OperationPagination {
  page: number
  lastPage: number
  total: number
}

export const LIFECYCLE_CONFIG: Record<LifecycleStatus, { label: string; color: string; i18nKey: string }> = {
  draft: { label: 'Brouillon', color: 'gray', i18nKey: 'operations.status.draft' },
  preparing: { label: 'En préparation', color: 'blue', i18nKey: 'operations.status.preparing' },
  on_hold: { label: 'En pause', color: 'orange', i18nKey: 'operations.status.on_hold' },
  ready: { label: 'Prête', color: 'indigo', i18nKey: 'operations.status.ready' },
  scheduled: { label: 'Planifiée', color: 'cyan', i18nKey: 'operations.status.scheduled' },
  processing: { label: 'En cours', color: 'violet', i18nKey: 'operations.status.processing' },
  delivered: { label: 'Livrée', color: 'emerald', i18nKey: 'operations.status.delivered' },
  completed: { label: 'Terminée', color: 'green', i18nKey: 'operations.status.completed' },
  cancelled: { label: 'Annulée', color: 'red', i18nKey: 'operations.status.cancelled' },
}

export const OPERATION_TYPE_CONFIG: Record<OperationType, { label: string; i18nKey: string }> = {
  loc: { label: 'Location', i18nKey: 'operations.type.loc' },
  fid: { label: 'Fidélisation', i18nKey: 'operations.type.fid' },
  rloc: { label: 'Repasse Location', i18nKey: 'operations.type.rloc' },
  acq: { label: 'Acquisition', i18nKey: 'operations.type.acq' },
  qual: { label: 'Qualification', i18nKey: 'operations.type.qual' },
  rep: { label: 'Repasse', i18nKey: 'operations.type.rep' },
  enrich: { label: 'Enrichissement', i18nKey: 'operations.type.enrich' },
  valid: { label: 'Validation', i18nKey: 'operations.type.valid' },
  filtre: { label: 'Filtrage', i18nKey: 'operations.type.filtre' },
}

/** Allowed lifecycle transitions (from → to[]) */
export const LIFECYCLE_TRANSITIONS: Partial<Record<LifecycleStatus, LifecycleStatus[]>> = {
  draft: ['preparing', 'cancelled'],
  preparing: ['on_hold', 'ready', 'cancelled'],
  on_hold: ['preparing', 'cancelled'],
  ready: ['on_hold', 'scheduled', 'cancelled'],
  scheduled: ['on_hold', 'processing', 'cancelled'],
  processing: ['delivered', 'cancelled'],
  delivered: ['completed'],
}
