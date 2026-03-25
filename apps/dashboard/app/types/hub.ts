export interface HubStats {
  partnersCount: number
  activePartnersCount: number
  totalCredits: number
  totalDemandes: number
}

export interface PartnerAlert {
  partnerId: number
  partnerName: string
  type: 'low-credits' | 'inactive'
  message: string
}
