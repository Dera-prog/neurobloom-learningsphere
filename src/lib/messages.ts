import { supabase } from './supabase'

/**
 * Conversation access (0012_conversations.sql). Threads are created through the
 * start_conversation RPC, which checks a real relationship (guardian ↔ class
 * teacher, student ↔ accepted tutor, anyone ↔ admin). The send trigger stamps
 * the sender's id and name, and sent messages cannot be edited.
 */

export const messagesConfigured = Boolean(supabase)

export interface ContactRecord {
  id: string
  name: string
  role: string
  context: string
}

export interface ConversationRecord {
  id: string
  peerId: string
  peerName: string
  peerRole: string
  lastMessageAt: string
  lastBody: string
}

export interface MessageRecord {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  body: string
  createdAt: string
}

interface ContactRow {
  id: string
  full_name: string
  role: string
  context: string
}

interface ConversationRow {
  conversation_id: string
  peer_id: string
  peer_name: string
  peer_role: string
  last_message_at: string
  last_body: string
}

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  body: string
  created_at: string
}

const MESSAGE_COLUMNS = 'id,conversation_id,sender_id,sender_name,body,created_at'

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'Messages are unavailable.'
}

function mapMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name || 'Account',
    body: row.body,
    createdAt: row.created_at,
  }
}

/** People the caller may message. Null means the list is unreachable. */
export async function loadContacts(): Promise<ContactRecord[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('my_contacts')
  if (error) {
    console.warn('[messages] contacts unavailable:', messageOf(error))
    return null
  }
  return ((data ?? []) as ContactRow[]).map((row) => ({
    id: row.id,
    name: row.full_name || 'Account',
    role: row.role,
    context: row.context,
  }))
}

/** The caller's threads, newest activity first. Null means unreachable. */
export async function loadConversations(): Promise<ConversationRecord[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('my_conversations')
  if (error) {
    console.warn('[messages] conversations unavailable:', messageOf(error))
    return null
  }
  return ((data ?? []) as ConversationRow[]).map((row) => ({
    id: row.conversation_id,
    peerId: row.peer_id,
    peerName: row.peer_name || 'Account',
    peerRole: row.peer_role,
    lastMessageAt: row.last_message_at,
    lastBody: row.last_body,
  }))
}

/** Messages in one thread, oldest first. Null means unreachable. */
export async function loadMessages(conversationId: string): Promise<MessageRecord[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) {
    console.warn('[messages] thread unavailable:', messageOf(error))
    return null
  }
  return ((data ?? []) as MessageRow[]).map(mapMessage)
}

/** Send into an existing thread. Returns the stored row the database stamped. */
export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; error?: string; message?: MessageRecord }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const text = body.trim()
  if (!text) return { ok: false, error: 'Write a message first.' }
  if (text.length > 4000) return { ok: false, error: 'That message is too long (4000 characters max).' }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ conversation_id: conversationId, body: text })
    .select(MESSAGE_COLUMNS)
    .single()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'The message was not saved.' }
  return { ok: true, message: mapMessage(data as MessageRow) }
}

/** Open (or reuse) a thread with this person and send the first message. */
export async function startConversation(
  peerId: string,
  body: string,
): Promise<{ ok: boolean; error?: string; conversationId?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const text = body.trim()
  if (!text) return { ok: false, error: 'Write a message first.' }
  if (text.length > 4000) return { ok: false, error: 'That message is too long (4000 characters max).' }

  const { data, error } = await supabase.rpc('start_conversation', { peer: peerId, body: text })
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'The conversation was not created.' }
  return { ok: true, conversationId: String(data) }
}
