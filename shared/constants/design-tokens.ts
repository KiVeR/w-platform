/**
 * Design Token System
 *
 * Single source of truth for style value scales used by:
 * - AI prompt constraints (design-generation.ts)
 * - Post-generation validation (shared/utils/design-tokens.ts)
 * - UI controls (TokenPicker component — Release 2)
 */

export const DESIGN_TOKENS = {
  fontSize: ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'],
  fontWeight: ['400', '600', '700', '900'],
  lineHeight: ['1', '1.2', '1.4', '1.5', '1.6', '1.8', '2'],
  spacing: ['0', '4px', '8px', '12px', '16px', '24px', '32px', '48px'],
  borderRadius: ['0', '4px', '8px', '12px', '50px'],
} as const

export type DesignTokenCategory = keyof typeof DESIGN_TOKENS

/**
 * Semantic labels (FR) for UI display — used by TokenPicker (Release 2)
 */
export const SPACING_LABELS: Record<string, string> = {
  '0': 'Aucun',
  '4px': 'Très petit',
  '8px': 'Petit',
  '12px': 'Petit-Moyen',
  '16px': 'Moyen',
  '24px': 'Grand',
  '32px': 'Très grand',
  '48px': 'Énorme',
}

export const BORDER_RADIUS_LABELS: Record<string, string> = {
  '0': 'Carré',
  '4px': 'Légèrement arrondi',
  '8px': 'Arrondi',
  '12px': 'Très arrondi',
  '50px': 'Circulaire',
}

/**
 * Generate a formatted string of design token constraints for AI prompts.
 * Imported by design-generation.ts to keep prompt in sync with constants.
 */
export function formatDesignTokensForPrompt(): string {
  return `## Design Token Constraints (CRITICAL)

ONLY use the exact values listed below for structural style properties. Using other values breaks design consistency.

### Typography Tokens
| Property | Allowed Values | Usage Context |
|----------|----------------|---------------|
| fontSize | ${DESIGN_TOKENS.fontSize.join(', ')} | 12-14px: captions, fine print · 16-18px: body text · 20-24px: emphasis, subtitles · 28-32px: section titles · 36-48px: hero titles |
| fontWeight | ${DESIGN_TOKENS.fontWeight.join(', ')} | 400: body text · 600: emphasis · 700: section titles · 900: hero titles |
| lineHeight | ${DESIGN_TOKENS.lineHeight.join(', ')} | 1-1.2: headings · 1.4-1.6: body text · 1.8-2: loose text |

### Spacing Tokens (margin, padding, gap)
| Allowed Values | Usage Context |
|----------------|---------------|
| ${DESIGN_TOKENS.spacing.join(', ')} | 0-4px: tight (within components) · 8-16px: comfortable (between elements) · 24-48px: generous (between sections) |

Compound values MUST use token values for each side: "16px 24px" ✅, "15px 20px" ❌

### Border Radius Tokens
| Allowed Values | Usage Context |
|----------------|---------------|
| ${DESIGN_TOKENS.borderRadius.join(', ')} | 0: sharp · 4px: subtle · 8px: medium (default) · 12px: rounded · 50px: pill/circle |

### Visual Hierarchy Rules
- Hero title: fontSize 36-48px, fontWeight 900
- Section titles: fontSize 24-32px, fontWeight 700
- Body text: fontSize 16-18px, fontWeight 400
- Captions/small: fontSize 12-14px, fontWeight 400

### Variety Requirement
Use at least 3 different fontSize values and 4 different spacing values to create visual rhythm. Avoid mechanical uniformity.

### Colors
Colors are NOT constrained to a fixed scale. Use globalStyles (primaryColor, textColor, backgroundColor) as the primary source, and choose complementary colors freely to match the brand/sector.

### Pre-flight Validation
Before outputting JSON, verify:
□ Every fontSize is from the allowed scale
□ Every padding/margin/gap value uses only token values (including each side of compound values)
□ Every borderRadius is from the allowed scale
□ Visual hierarchy is clear (hero > sections > body > captions)
□ At least 3 different fontSize values and 4 different spacing values are used`
}
