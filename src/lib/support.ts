import { supabase } from './supabase'

/**
 * Support ticket access (0011_support_tickets.sql). A signed-in account files a
 * complaint; the database stamps who filed it and forces it open. Only an admin
 * can reply or change the status, and the reviewer name/time are stamped there.
 */

export const supportConfigured = Boolean(supabase)

export type TicketStatus = 'open' | 'waiting' | 'resolved'
export type TicketPriority = 'urgent' | 'high' | 'normal'

export interface SupportTicketRecord {
  id: string
  requesterId: string
  requesterName: string
  requesterRole: string
  category: string
  subject: string
  body: string
  priority: TicketPriority
  status: TicketStatus
  reply: string
  repliedByName: string
  repliedAt: string | null
  createdAt: string
  updatedAt: string
}

interface TicketRow {
  id: string
  requester_id: string
  requester_name: string
  requester_role: string
  category: string
  subject: string
  body: string
  priority: TicketPriority
  status: TicketStatus
  reply: string
  replied_by_name: string
  replied_at: string | null
  created_at: string
  updated_at: string
}

const TICKET_COLUMNS =
  'id,requester_id,requester_name,requester_role,category,subject,body,priority,status,reply,replied_by_name,replied_at,created_at,updated_at'

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'The support desk is unavailable.'
}

function mapTicket(row: TicketRow): SupportTicketRecord {
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.requester_name || 'Account',
    requesterRole: row.requester_role,
    category: row.category,
    subject: row.subject,
    body: row.body,
    priority: row.priority,
    status: row.status,
    reply: row.reply,
    repliedByName: row.replied_by_name,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Short subject from the first line of the complaint. */
export function ticketSubject(body: string, category: string) {
  const text = body.trim()
  const firstLine = text.split(/[.!?\n]/)[0]?.trim() || category
  return firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine
}

/** Money problems and specialist requests get the same urgency as seeded ones. */
export function ticketPriority(category: string): TicketPriority {
  if (category === 'Payments & earnings') return 'high'
  if (category === 'Special-needs support') return 'high'
  return 'normal'
}

/** The caller's own tickets. Null means the table is unreachable. */
export async function loadMyTickets(userId: string): Promise<SupportTicketRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(TICKET_COLUMNS)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as TicketRow[]).map(mapTicket)
  } catch (error) {
    console.warn('[support] own tickets unavailable:', messageOf(error))
    return null
  }
}

export async function createSupportTicket(input: {
  category: string
  body: string
  priority?: TicketPriority
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const body = input.body.trim()
  if (body.length < 5) return { ok: false, error: 'Add a little more detail (at least 5 characters).' }

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      category: input.category,
      subject: ticketSubject(body, input.category),
      body,
      priority: input.priority ?? ticketPriority(input.category),
    })
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!data || !(data as unknown[]).length) return { ok: false, error: 'The ticket was not saved.' }
  return { ok: true }
}

/** The full queue for an admin. Null means the table is unreachable. */
export async function loadTicketQueue(): Promise<SupportTicketRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(TICKET_COLUMNS)
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as TicketRow[]).map(mapTicket)
  } catch (error) {
    console.warn('[support] queue unavailable:', messageOf(error))
    return null
  }
}

export async function replyToTicket(
  ticketId: string,
  input: { status: TicketStatus; reply?: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const patch: { status: TicketStatus; reply?: string } = { status: input.status }
  if (input.reply !== undefined) patch.reply = input.reply
  const { data, error } = await supabase
    .from('support_tickets')
    .update(patch)
    .eq('id', ticketId)
    .select('id,status')
  if (error) return { ok: false, error: error.message }
  if (!data || !(data as unknown[]).length) {
    return { ok: false, error: 'Only the admin team can answer a ticket.' }
  }
  return { ok: true }
}
