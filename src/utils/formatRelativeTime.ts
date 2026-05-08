/**
 * Formats an ISO 8601 timestamp as a relative time string in Indonesian.
 * e.g. "2 jam lalu", "5 menit lalu", "3 hari lalu"
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'baru saja'

  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) return 'baru saja'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} hari lalu`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} bulan lalu`

  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} tahun lalu`
}
