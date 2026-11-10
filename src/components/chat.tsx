import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Search,
  Send,
  SmilePlus,
  Video,
} from 'lucide-react'
import type { Audience, Thread } from '../data/content'
import { useApp } from '../store/store'
import { cn, uid } from '../lib/utils'
import { Avatar, Button, Modal, TextArea } from './ui'
import { useToast } from './toast'

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
  const toast = useToast()
  const threads = threadsFor(audience)
  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId ?? threads[0]?.id ?? null)
  const [listOnly, setListOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selected = threads.find((t) => t.id === selectedId) ?? null
  const filtered = threads.filter(
    (t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.subtitle.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    if (selectedId) dispatch({ type: 'READ_THREAD', threadId: selectedId })
  }, [selectedId, dispatch])

  useEffect(() => {
    if (!selectedId && !listOnly) setSelectedId(threads[0]?.id ?? null)
  }, [threads, selectedId, listOnly])

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

  const send = () => {
    const text = draft.trim()
    if (!text || !selected) return
    dispatch({ type: 'SEND_MESSAGE', threadId: selected.id, text, author })
    setDraft('')
  }

  return (
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
              className="h-9 w-full rounded-xl border border-border bg-input/60 pl-8 pr-3 text-xs outline-none transition focus:border-primary/40 focus:bg-card"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              active={thread.id === selectedId}
              onSelect={() => {
                setListOnly(false)
                setSelectedId(thread.id)
              }}
            />
          ))}
          {!filtered.length ? <p className="px-3 py-8 text-center text-xs text-muted-foreground">No conversations found.</p> : null}
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
                        dispatch({ type: 'READ_THREAD', threadId: selected.id })
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
                    send()
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
              <Button size="icon" variant="role" onClick={send} disabled={!draft.trim()} aria-label="Send message">
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
  const toast = useToast()
  const [text, setText] = useState('')

  const existing = state.threads.find((t) => t.audience === audience && t.title.toLowerCase() === to.toLowerCase())

  useEffect(() => {
    if (open) setText('')
  }, [open])

  const send = () => {
    const body = text.trim()
    if (!body) return
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
            <Button variant="role" size="sm" onClick={send} disabled={!text.trim()}>
              <Send size={13} /> Send
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
