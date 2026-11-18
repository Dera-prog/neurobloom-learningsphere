import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Plus,
  Search,
  Send,
  SmilePlus,
  Video,
} from 'lucide-react'
import type { Audience, ChatMessage, Thread } from '../data/content'
import { useAuth } from '../lib/auth'
import {
  loadContacts,
  loadConversations,
  loadMessages,
  messagesConfigured,
  sendMessage,
  startConversation,
  type ContactRecord,
  type ConversationRecord,
  type MessageRecord,
} from '../lib/messages'
import { useApp } from '../store/store'
import { cn, uid } from '../lib/utils'
import { Avatar, Badge, Button, Modal, TextArea } from './ui'
import { useToast } from './toast'

const LIVE_PREFIX = 'live:'

const ROLE_LABEL: Record<string, string> = {
  teacher: 'Teacher',
  parent: 'Parent / guardian',
  junior: 'Student',
  senior: 'Student',
  special: 'Student',
  admin: 'Admin team',
}

const ROLE_EMOJI: Record<string, string> = {
  teacher: '👩🏽‍🏫',
  parent: '👪',
  junior: '🎓',
  senior: '🎓',
  special: '🎓',
  admin: '🛟',
}

function roleLabel(role: string) {
  return ROLE_LABEL[role] ?? role
}

function roleEmoji(role: string) {
  return ROLE_EMOJI[role] ?? '💬'
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`
  const date = new Date(then)
  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 48 * 3_600_000) return 'Yesterday'
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function toChatMessage(message: MessageRecord, userId: string | null): ChatMessage {
  return {
    id: message.id,
    author: message.senderName,
    text: message.body,
    time: relativeTime(message.createdAt),
    mine: Boolean(userId) && message.senderId === userId,
  }
}

function threadFromConversation(conversation: ConversationRecord, audience: Audience): Thread {
  return {
    id: `${LIVE_PREFIX}${conversation.id}`,
    audience,
    title: conversation.peerName,
    subtitle: roleLabel(conversation.peerRole),
    emoji: roleEmoji(conversation.peerRole),
    messages: [],
  }
}

export function Messenger({
  audience,
  author,
  initialThreadId,
}: {
  audience: Audience
  author: string
  initialThreadId?: string
}) {
  const { threadsFor, dispatch } = useApp()
  const { profile } = useAuth()
  const toast = useToast()
  const userId = profile?.id ?? null
  const live = messagesConfigured
  const seeded = threadsFor(audience)

  const [liveThreads, setLiveThreads] = useState<Thread[] | null>(null)
  const [liveLoading, setLiveLoading] = useState(live)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const loadedRef = useRef<Set<string>>(new Set())

  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId ?? null)
  const [listOnly, setListOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Live conversations load from the server. If the RPC fails, the seeded
  // display threads stand in and the list says so; an empty live list stays
  // empty so nobody mistakes sample chats for their own.
  const sample = live && !liveLoading && liveThreads === null
  const threads = live ? (sample ? seeded : liveThreads ?? []) : seeded
  const selected = threads.find((t) => t.id === selectedId) ?? null
  const filtered = threads.filter(
    (t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.subtitle.toLowerCase().includes(query.toLowerCase()),
  )

  const refreshLive = useCallback(async () => {
    if (!live || !userId) return
    const conversations = await loadConversations()
    setLiveLoading(false)
    if (conversations === null) {
      setLiveThreads(null)
      return
    }
    setLiveThreads((current) => {
      const prior = new Map((current ?? []).map((thread) => [thread.id, thread]))
      return conversations.map((conversation) => {
        const id = `${LIVE_PREFIX}${conversation.id}`
        const existing = prior.get(id)
        return existing
          ? { ...existing, title: conversation.peerName, subtitle: roleLabel(conversation.peerRole) }
          : threadFromConversation(conversation, audience)
      })
    })
  }, [live, userId, audience])

  useEffect(() => {
    if (!live || !userId) {
      setLiveLoading(false)
      return
    }
    loadedRef.current = new Set()
    setLiveLoading(true)
    void refreshLive()
  }, [live, userId, refreshLive])

  useEffect(() => {
    if (selectedId && !selectedId.startsWith(LIVE_PREFIX)) dispatch({ type: 'READ_THREAD', threadId: selectedId })
  }, [selectedId, dispatch])

  useEffect(() => {
    if (!selectedId && !listOnly) setSelectedId(threads[0]?.id ?? null)
  }, [threads, selectedId, listOnly])

  useEffect(() => {
    if (!selected || !selected.id.startsWith(LIVE_PREFIX) || loadedRef.current.has(selected.id)) return
    const threadId = selected.id
    const conversationId = threadId.slice(LIVE_PREFIX.length)
    let cancelled = false
    setLoadingMessages(true)
    void loadMessages(conversationId).then((rows) => {
      if (cancelled) return
      setLoadingMessages(false)
      if (rows === null) {
        toast('Conversation unavailable', { description: 'Try opening it again in a moment.', tone: 'warn' })
        return
      }
      loadedRef.current.add(threadId)
      const mapped = rows.map((message) => toChatMessage(message, userId))
      setLiveThreads((current) => current?.map((thread) => (thread.id === threadId ? { ...thread, messages: mapped } : thread)) ?? current)
    })
    return () => {
      cancelled = true
    }
  }, [selected, userId, toast])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [selected?.messages.length, selectedId])

  useEffect(() => {
    setDraft('')
    setMenuOpen(false)
  }, [selectedId])

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const send = async () => {
    const text = draft.trim()
    if (!text || !selected || sending) return

    if (live && selected.id.startsWith(LIVE_PREFIX)) {
      const threadId = selected.id
      const conversationId = threadId.slice(LIVE_PREFIX.length)
      setSending(true)
      const result = await sendMessage(conversationId, text)
      setSending(false)
      if (!result.ok || !result.message) {
        toast('Message not sent', { description: result.error, tone: 'warn' })
        return
      }
      const stored = toChatMessage(result.message, userId)
      loadedRef.current.add(threadId)
      setLiveThreads((current) => current?.map((thread) => (thread.id === threadId ? { ...thread, messages: [...thread.messages, stored] } : thread)) ?? current)
      setDraft('')
      return
    }

    dispatch({ type: 'SEND_MESSAGE', threadId: selected.id, text, author })
    setDraft('')
  }

  return (
    <>
      <div className="grid h-[calc(100dvh-12.5rem)] min-h-[420px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card sm:min-h-[480px] md:grid-cols-[280px_1fr]">
        <div
          className={cn(
            'flex min-h-0 flex-col border-border md:border-r',
            selected ? 'hidden md:flex' : 'flex',
          )}
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="h-9 w-full rounded-xl border border-border bg-input/60 pl-8 pr-10 text-xs outline-none transition focus:border-primary/40 focus:bg-card"
              />
              {live && !sample ? (
                <button
                  type="button"
                  onClick={() => setNewOpen(true)}
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="New conversation"
                >
                  <Plus size={15} />
                </button>
              ) : null}
            </div>
            {sample ? (
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Badge tone="neutral">Sample</Badge> Live conversations are unavailable.
              </p>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {liveLoading ? (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">Loading conversations…</p>
            ) : null}
            {!liveLoading
              ? filtered.map((thread) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    active={thread.id === selectedId}
                    onSelect={() => {
                      setListOnly(false)
                      setSelectedId(thread.id)
                    }}
                  />
                ))
              : null}
            {!liveLoading && !filtered.length ? (
              live && !sample ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    {query ? 'No conversations match your search.' : 'No conversations yet.'}
                  </p>
                  {!query ? (
                    <Button className="mt-3" size="sm" variant="soft" onClick={() => setNewOpen(true)}>
                      Start a conversation
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="px-3 py-8 text-center text-xs text-muted-foreground">No conversations found.</p>
              )
            ) : null}
          </div>
        </div>

        {selected ? (
          <div className={cn('flex min-h-0 min-w-0 flex-col', selected ? 'flex' : 'hidden md:flex')}>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setListOnly(true)
                  setSelectedId(null)
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={17} />
              </button>
              <Avatar emoji={selected.emoji} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{selected.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{selected.subtitle}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toast('Calling is disabled in the demo', { description: 'Safety settings keep calls inside scheduled classes.', tone: 'info' })}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Voice call"
                >
                  <Phone size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => toast('Video room would open for scheduled classes', { tone: 'info' })}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Video call"
                >
                  <Video size={15} />
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    aria-label="Conversation options"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen ? (
                    <div role="menu" className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl animate-pop">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          if (!selected.id.startsWith(LIVE_PREFIX)) dispatch({ type: 'READ_THREAD', threadId: selected.id })
                          setMenuOpen(false)
                          toast('Conversation marked as read')
                        }}
                        className="w-full px-3 py-2 text-left text-[11px] font-medium text-foreground transition hover:bg-muted"
                      >
                        Mark as read
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          toast('Contact details', { description: `${selected.title} · ${selected.subtitle}`, tone: 'info' })
                        }}
                        className="w-full px-3 py-2 text-left text-[11px] font-medium text-foreground transition hover:bg-muted"
                      >
                        Contact info
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          toast('Notifications muted for this chat', { tone: 'info' })
                        }}
                        className="w-full px-3 py-2 text-left text-[11px] font-medium text-foreground transition hover:bg-muted"
                      >
                        Mute notifications
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {selected.pinned ? (
              <div className="flex items-start gap-2 border-b border-border bg-role-soft/60 px-4 py-2.5 text-[11px] leading-relaxed text-role-ink">
                <Pin size={13} className="mt-0.5 shrink-0" />
                <p>{selected.pinned}</p>
              </div>
            ) : null}

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/40 px-4 py-4">
              {selected.id.startsWith(LIVE_PREFIX) && !selected.messages.length && loadingMessages ? (
                <p className="text-center text-xs text-muted-foreground">Loading messages…</p>
              ) : null}
              {selected.messages.map((msg) => (
                <div key={msg.id} className={cn('flex gap-2', msg.mine ? 'justify-end' : 'justify-start')}>
                  {!msg.mine ? <Avatar emoji={msg.avatar ?? selected.emoji} size="sm" /> : null}
                  <div className={cn('min-w-0 max-w-[78%]', msg.mine && 'items-end')}>
                    {!msg.mine ? (
                      <div className="mb-1 flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-bold text-foreground">{msg.author}</span>
                        {msg.staff ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold text-primary">STAFF</span> : null}
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap',
                        msg.mine
                          ? 'rounded-br-md bg-role text-white'
                          : 'rounded-bl-md border border-border bg-card text-foreground',
                      )}
                    >
                      {msg.text}
                    </div>
                    <p className={cn('mt-1 px-1 text-[9px] text-muted-foreground', msg.mine && 'text-right')}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => toast('Attachment picker', { description: 'PDF, image and audio uploads are supported.', tone: 'info' })}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                  aria-label="Attach a file"
                >
                  <Paperclip size={16} />
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  rows={1}
                  placeholder="Write a message…"
                  aria-label="Message"
                  className="max-h-24 min-h-9 min-w-0 flex-1 resize-none rounded-xl border border-border bg-input/60 px-3 py-2 text-xs outline-none transition focus:border-primary/40 focus:bg-card"
                />
                <button
                  type="button"
                  onClick={() => toast('Voice note', { description: 'Hold to record in the full app.', tone: 'info' })}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                  aria-label="Record a voice note"
                >
                  <Mic size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => `${d} 🙂`)}
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted sm:flex"
                  aria-label="Add an emoji"
                >
                  <SmilePlus size={16} />
                </button>
                <Button size="icon" variant="role" onClick={() => void send()} disabled={!draft.trim() || sending} aria-label="Send message">
                  <Send size={15} />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden items-center justify-center text-xs text-muted-foreground md:flex">
            Choose a conversation to start chatting.
          </div>
        )}
      </div>

      {live ? (
        <NewConversationModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          onStarted={async (conversationId) => {
            await refreshLive()
            loadedRef.current.delete(`${LIVE_PREFIX}${conversationId}`)
            setSelectedId(`${LIVE_PREFIX}${conversationId}`)
          }}
        />
      ) : null}
    </>
  )
}

function ThreadRow({ thread, active, onSelect }: { thread: Thread; active: boolean; onSelect: () => void }) {
  const last = thread.messages[thread.messages.length - 1]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'mb-1 flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition',
        active ? 'bg-role-soft' : 'hover:bg-muted/70',
      )}
    >
      <Avatar emoji={thread.emoji} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('truncate text-xs font-bold', active ? 'text-role-ink' : 'text-foreground')}>{thread.title}</p>
          <span className="shrink-0 text-[9px] text-muted-foreground">{last?.time}</span>
        </div>
        <p className="truncate text-[10px] text-muted-foreground">{last ? `${last.mine ? 'You: ' : ''}${last.text}` : thread.subtitle}</p>
      </div>
      {thread.unread ? (
        <span className="mt-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-role px-1 text-[9px] font-bold text-white">
          {thread.unread}
        </span>
      ) : null}
    </button>
  )
}

function NewConversationModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean
  onClose: () => void
  onStarted: (conversationId: string) => void | Promise<void>
}) {
  const toast = useToast()
  const [contacts, setContacts] = useState<ContactRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedId(null)
    setText('')
    void loadContacts().then((rows) => {
      setContacts(rows)
      setLoading(false)
    })
  }, [open])

  const selected = contacts?.find((contact) => contact.id === selectedId) ?? null

  const send = async () => {
    const body = text.trim()
    if (!selected || !body || sending) return
    setSending(true)
    const result = await startConversation(selected.id, body)
    setSending(false)
    if (!result.ok || !result.conversationId) {
      toast('Conversation not started', { description: result.error, tone: 'warn' })
      return
    }
    toast(`Message sent to ${selected.name}`, { tone: 'success' })
    onClose()
    await onStarted(result.conversationId)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      subtitle="You can message your teachers, students, parents and the admin team."
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">Messages are monitored for child safety.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="role" size="sm" onClick={() => void send()} disabled={!selected || !text.trim() || sending}>
              <Send size={13} /> {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Loading contacts…</p>
      ) : contacts === null ? (
        <p className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          Your contact list is unavailable right now. Try again in a moment.
        </p>
      ) : !contacts.length ? (
        <p className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          No contacts yet. Contacts appear when you join a class, book a tutor, or when the admin team messages you.
        </p>
      ) : (
        <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
          {contacts.map((contact) => (
            <button
              type="button"
              key={contact.id}
              onClick={() => setSelectedId(contact.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition',
                contact.id === selectedId
                  ? 'border-role/40 bg-role-soft'
                  : 'border-border/70 hover:bg-muted/50',
              )}
            >
              <Avatar emoji={roleEmoji(contact.role)} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-foreground">{contact.name}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {roleLabel(contact.role)}
                  {contact.context ? ` · ${contact.context}` : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <TextArea
          label="First message"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hello, I’d like to ask about…"
        />
      </div>
    </Modal>
  )
}

export function ComposeMessageModal({
  open,
  onClose,
  to,
  subtitle,
  audience,
  emoji = '💬',
  author,
}: {
  open: boolean
  onClose: () => void
  to: string
  subtitle: string
  audience: Audience
  emoji?: string
  author: string
}) {
  const { state, dispatch } = useApp()
  const { profile } = useAuth()
  const toast = useToast()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const existing = state.threads.find((t) => t.audience === audience && t.title.toLowerCase() === to.toLowerCase())

  useEffect(() => {
    if (open) setText('')
  }, [open])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return

    // With a real account, the message goes into a server-side conversation
    // with the matching contact. If the name is only display content (no
    // linked account), say so instead of pretending it was delivered.
    if (messagesConfigured && profile?.id) {
      setSending(true)
      const contacts = await loadContacts()
      if (contacts === null) {
        setSending(false)
        toast('Message not sent', { description: 'Messages are unavailable right now. Try again.', tone: 'warn' })
        return
      }
      const target = contacts.find((contact) => contact.name.toLowerCase() === to.trim().toLowerCase())
      if (!target) {
        setSending(false)
        toast('This contact isn’t linked to your account', {
          description: `${to} has no NeuroBloom account linked to your classes yet. Open Messages and use New conversation to pick a contact.`,
          tone: 'warn',
        })
        return
      }
      const result = await startConversation(target.id, body)
      setSending(false)
      if (!result.ok) {
        toast('Message not sent', { description: result.error, tone: 'warn' })
        return
      }
      toast(`Message sent to ${target.name}`, { tone: 'success' })
      onClose()
      return
    }

    if (existing) {
      dispatch({ type: 'SEND_MESSAGE', threadId: existing.id, text: body, author })
    } else {
      dispatch({
        type: 'CREATE_THREAD',
        thread: {
          id: uid('thread'),
          audience,
          title: to,
          subtitle,
          emoji,
          messages: [
            { id: uid('msg'), author, text: body, time: 'Just now', mine: true },
          ],
        },
      })
    }
    toast(`Message sent to ${to}`, { tone: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Message ${to}`}
      subtitle={subtitle}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">Messages are monitored for child safety.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="role" size="sm" onClick={() => void send()} disabled={!text.trim() || sending}>
              <Send size={13} /> {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted p-3">
        <Avatar emoji={emoji} />
        <div>
          <p className="text-sm font-bold text-foreground">{to}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <TextArea
        label="Your message"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hello, I’d like to ask about…"
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Thank you for the update', 'Could we schedule a call?', 'How is my child progressing?'].map((prompt) => (
          <button
            type="button"
            key={prompt}
            onClick={() => setText(prompt)}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-role/30 hover:text-role-ink"
          >
            {prompt}
          </button>
        ))}
      </div>
    </Modal>
  )
}
