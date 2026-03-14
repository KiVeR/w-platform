import type { CampaignTargeting, CanonicalTargeting } from '@/types/campaign'

/**
 * Convert canonical targeting (from API) to UI format (for wizard store).
 * Reads from `input` to rebuild the user's original selection.
 */
export function canonicalToUi(canonical: CanonicalTargeting): CampaignTargeting {
  const input = canonical.input as Record<string, unknown>

  return {
    method: canonical.method,
    departments: (input.departments as string[]) ?? [],
    postcodes: (input.postcodes as string[]) ?? [],
    communes: (input.communes as string[]) ?? [],
    iris_codes: (input.iris_codes as string[]) ?? [],
    address: (input.address as string) ?? null,
    lat: (input.lat as number) ?? null,
    lng: (input.lng as number) ?? null,
    radius: (input.radius as number) ?? null,
    gender: canonical.demographics?.gender ?? null,
    age_min: canonical.demographics?.age_min ?? null,
    age_max: canonical.demographics?.age_max ?? null,
  }
}
