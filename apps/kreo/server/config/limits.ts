export const VERSION_LIMITS = {
  /** Maximum number of versions per landing page. Older versions are purged beyond this limit */
  MAX_VERSIONS_PER_PAGE: 100,
  /** Maximum restore operations allowed per hour per user */
  RATE_LIMIT_RESTORE_PER_HOUR: 10,
} as const
