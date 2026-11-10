import type { SupportTicket } from '../data/admin-ops'

// Teacher complaints are written here and picked up by the Admin Manager
// support desk. localStorage is shared across the sign-ins in this browser.
export const COMPLAINTS_KEY = 'neurobloom:complaints:v1'

export const COMPLAINT_CATEGORIES = [
  'Classes & scheduling',
  'Payments & earnings',
  'Messages & delivery',
  'Account & access',
  'Special-needs support',
  'Something else',
] as const

export interface TeacherComplaint extends SupportTicket {
  category: string
  createdAt: string
}

function today() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function readComplaints(): TeacherComplaint[] {
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is TeacherComplaint =>
        Boolean(item) && typeof item === 'object' && typeof (item as TeacherComplaint).id === 'string' && typeof (item as TeacherComplaint).subject === 'string',
    )
  } catch {
    return []
  }
}

export function addComplaint({
  message,
  category,
  requester,
}: {
  message: string
  category: string
  requester: string
}) {
  const text = message.trim()
  const firstLine = text.split(/[.!?\n]/)[0]?.trim() || category
  const subject = firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine
  const complaint: TeacherComplaint = {
    id: `SUP-${String(Date.now()).slice(-6)}`,
    subject,
    requester,
    role: 'Teacher',
    // Money problems get the same urgency as the seeded payment tickets.
    priority: category === 'Payments & earnings' ? 'high' : 'normal',
    opened: today(),
    updated: 'Just now',
    status: 'open',
    excerpt: text.length > 220 ? `${text.slice(0, 217)}…` : text,
    category,
    createdAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify([complaint, ...readComplaints()]))
  } catch {
    // Private browsing can block storage; the teacher still sees the confirmation.
  }
  return complaint
}
