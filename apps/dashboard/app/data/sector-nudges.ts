export interface SectorConfig {
  radiusHint: [number, number] | null
  genderHint: 'M' | 'F' | null
  ageHint: [number, number] | null
  labelKey: string
}

export const SECTOR_CONFIGS: Record<string, SectorConfig> = {
  optique: { radiusHint: [5, 10], genderHint: null, ageHint: [40, 75], labelKey: 'wizard.estimate.sector.optique' },
  immobilier: { radiusHint: null, genderHint: null, ageHint: [25, 60], labelKey: 'wizard.estimate.sector.immobilier' },
  restauration: { radiusHint: [2, 5], genderHint: null, ageHint: [25, 55], labelKey: 'wizard.estimate.sector.restauration' },
  fleuriste: { radiusHint: [5, 15], genderHint: 'F', ageHint: [25, 65], labelKey: 'wizard.estimate.sector.fleuriste' },
  thermalisme: { radiusHint: null, genderHint: null, ageHint: [55, 80], labelKey: 'wizard.estimate.sector.thermalisme' },
  automobile: { radiusHint: [15, 30], genderHint: null, ageHint: [30, 60], labelKey: 'wizard.estimate.sector.automobile' },
  proximite: { radiusHint: [2, 3], genderHint: null, ageHint: [25, 55], labelKey: 'wizard.estimate.sector.proximite' },
}
