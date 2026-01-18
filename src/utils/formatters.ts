export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  if (diffDays > 0) {
    return rtf.format(-diffDays, 'day')
  }
  if (diffHours > 0) {
    return rtf.format(-diffHours, 'hour')
  }
  if (diffMinutes > 0) {
    return rtf.format(-diffMinutes, 'minute')
  }
  return 'À l\'instant'
}
