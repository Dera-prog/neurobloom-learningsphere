export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function naira(value: number, compact = false) {
  if (compact && value >= 1_000_000) {
    const m = value / 1_000_000
    return `₦${Number.isInteger(m) ? m : m.toFixed(1)}M`
  }
  if (compact && value >= 1000) {
    const k = value / 1000
    return `₦${Number.isInteger(k) ? k : k.toFixed(1)}K`
  }
  return `₦${value.toLocaleString('en-NG')}`
}

export function initials(name: string) {
  return name
    .replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Miss)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function longDate(date = new Date()) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function shortDate(date = new Date()) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function dayMonth(date = new Date()) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function nextMonthlyDay(day: number, from = new Date()) {
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const inMonth = (monthOffset: number) => {
    const year = from.getFullYear()
    const month = from.getMonth() + monthOffset
    const lastDay = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, Math.min(day, lastDay))
  }
  const thisMonth = inMonth(0)
  return thisMonth >= startOfToday ? thisMonth : inMonth(1)
}

export function addDays(days: number, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

export function dueLabelFor(date: Date) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((target.getTime() - start.getTime()) / 86400000)
  if (diff <= 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff <= 6) return `Due ${date.toLocaleDateString('en-GB', { weekday: 'short' })}`
  return `Due ${dayMonth(date)}`
}

export function nextWaecDate() {
  const now = new Date()
  const year = now.getMonth() > 4 ? now.getFullYear() + 1 : now.getFullYear()
  return new Date(year, 4, 4)
}

export function daysUntil(date: Date) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.max(0, Math.round((target.getTime() - start.getTime()) / 86400000))
}

export function academicSession() {
  const now = new Date()
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}/${start + 1}`
}

export function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '')
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(','),
    )
    .join('\n')
  downloadText(filename, csv, 'text/csv;charset=utf-8')
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function pct(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
