import type { ContentType } from '../../shared/types/content'

/**
 * Labels for auto-generated content titles (distinct from UI labels in shared/types/content.ts)
 */
const AUTO_TITLE_LABELS: Record<ContentType, string> = {
  'landing-page': 'Page principale',
  'rcs': 'Message enrichi',
  'sms': 'SMS',
}

/**
 * Generate a default title for a content based on campaign title and content type
 */
export function generateContentTitle(campaignTitle: string, type: ContentType): string {
  return `${campaignTitle} - ${AUTO_TITLE_LABELS[type]}`
}

/**
 * Get the default design document for a landing page
 */
export function getDefaultLandingPageDesign() {
  return {
    version: '1.0',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      primaryColor: '#14b8a6',
      secondaryColor: '#0d9488',
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFontFamily: 'Inter, system-ui, sans-serif',
      baseFontSize: '16px',
      lineHeight: '1.6',
      contentPadding: '16px',
      widgetGap: '12px',
      borderRadius: '8px',
      pageTitle: '',
      metaDescription: '',
    },
    widgets: [],
  }
}

/**
 * Find the primary content ID from a list of contents.
 * Returns the first landing page content ID (the only editable type currently).
 */
export function findPrimaryContentId(contents: Array<{ id: number, type: string }>): number | null {
  const landingPage = contents.find(c => c.type === 'LANDING_PAGE')
  return landingPage?.id ?? null
}
