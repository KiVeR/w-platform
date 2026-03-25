export interface DemandeRow {
  id: number
  ref_demande: string
  ref_client: string | null
  information: string | null
  is_exoneration: boolean
  pays_id: string | null
  partner_id: number
  commercial_id: number | null
  sdr_id: number | null
  operations_count: number
  operations_completed_count: number
  operations_blocked_count: number
  created_at: string
  updated_at: string
  partner?: { id: number; name: string }
  operations?: DemandeOperationRow[]
}

export interface DemandeDetail extends DemandeRow {
  commercial?: { id: number; full_name: string } | null
  sdr?: { id: number; full_name: string } | null
  operations?: DemandeOperationRow[]
}

export interface DemandeOperationRow {
  id: number
  ref_operation: string
  line_number: number
  type: string
  name: string
  advertiser: string | null
  priority: string | null
  lifecycle_status: string
  last_transitioned_at: string | null
  created_at: string
}

export interface DemandeFilters {
  partner_id?: number
  ref_demande?: string
  is_exoneration?: boolean
  created_at_from?: string
  created_at_to?: string
}

export interface DemandePagination {
  page: number
  lastPage: number
  total: number
}
