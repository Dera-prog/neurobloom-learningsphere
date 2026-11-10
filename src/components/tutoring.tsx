import { useEffect, useState } from 'react'
import { CalendarDays, Check, ChevronRight, Clock, GraduationCap, ShieldCheck, Star } from 'lucide-react'
import type { ChildId, Tutor } from '../data/content'
import { useApp } from '../store/store'
import { cn, naira, uid } from '../lib/utils'
import { Avatar, Badge, Button, Input, Modal, TextArea } from './ui'
import { useToast } from './toast'
import { useAuth } from '../lib/auth'
import { looksLikeEmail, sendConfirmationEmail } from '../lib/email'

export function TutorBookingModal({
  open,
  onClose,
  tutors,
  initialTutorId,
  audience,
  child,
}: {
  open: boolean
  onClose: () => void
  tutors: Tutor[]
  initialTutorId?: string
  audience: 'senior' | 'parent'
  child?: ChildId
}) {
  const { dispatch } = useApp()
  const toast = useToast()
  const { configured, profile } = useAuth()
  const [tutorId, setTutorId] = useState(initialTutorId ?? tutors[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [slot, setSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState('')

  const tutor = tutors.find((t) => t.id === tutorId) ?? tutors[0]

  useEffect(() => {
    if (!open) return
    const start = tutors.find((t) => t.id === initialTutorId) ?? tutors[0]
    setTutorId(start?.id ?? '')
    setSubject(start?.subjects[0] ?? '')
    setSlot(start?.availability[0] ?? '')
    setNotes('')
    setEmail(profile?.email ?? '')
  }, [open, initialTutorId, tutors, profile?.email])

  useEffect(() => {
    if (!tutor) return
    setSubject(tutor.subjects[0])
    setSlot(tutor.availability[0])
  }, [tutor])

  if (!tutor) return null

  const book = async () => {
    if (!slot) {
      toast('Choose a time for your session', { tone: 'warn' })
      return
    }
    if (configured && !looksLikeEmail(email)) {
      toast('Add a confirmation email', { description: 'We send the session details there.', tone: 'warn' })
      return
    }
    dispatch({
      type: 'BOOK_TUTOR',
      booking: {
        id: uid('booking'),
        tutorName: tutor.name,
        tutorEmoji: tutor.emoji,
        subject,
        when: slot,
        rate: tutor.rate,
        audience,
        status: 'upcoming',
        child,
        notes: notes.trim() || undefined,
      },
    })
    onClose()

    if (!configured) {
      toast('Tutor session booked', { description: `${tutor.name} · ${subject} · ${slot}`, tone: 'success' })
      return
    }

    const result = await sendConfirmationEmail('booking', email, {
      tutorName: tutor.name,
      subject,
      slot,
      rate: naira(tutor.rate),
      studentName: profile?.full_name ?? '',
    })
    toast(result.sent ? 'Booking confirmed' : 'Booking saved', {
      description: result.sent ? `Confirmation sent to ${email.trim()}.` : result.message,
      tone: result.ok ? 'success' : 'warn',
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book a private tutor"
      subtitle="One-on-one sessions with verified specialists."
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-extrabold text-foreground">
              {naira(tutor.rate)} <span className="text-[11px] font-medium text-muted-foreground">/ hour</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Charged after the session · secure payment</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="role" size="sm" onClick={book}>
              <Check size={13} /> Confirm booking
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tutors.map((t) => {
            const active = t.id === tutor.id
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTutorId(t.id)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-3 text-left transition',
                  active ? 'border-role bg-role-soft/70' : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <Avatar emoji={t.emoji} size="md" color={t.accent} soft={t.soft} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">{t.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{t.subjects.join(' · ')}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-0.5 font-bold text-amber-600">
                      <Star size={9} className="fill-amber-400 text-amber-400" /> {t.rating}
                    </span>
                    <span className="text-muted-foreground">{naira(t.rate)}/hr</span>
                  </div>
                </div>
                {active ? <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-role text-white"><Check size={10} /></span> : null}
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl border border-border bg-background/50 p-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-600" /> Verified tutor</span>
            <span className="flex items-center gap-1"><GraduationCap size={12} /> {tutor.experience}</span>
            <span className="flex items-center gap-1"><Star size={11} className="text-amber-500" /> {tutor.reviews} reviews</span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">Subject</p>
          <div className="flex flex-wrap gap-1.5">
            {tutor.subjects.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSubject(s)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition',
                  subject === s ? 'border-role bg-role-soft text-role-ink' : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            <CalendarDays size={13} /> Choose a time
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tutor.availability.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setSlot(a)}
                className={cn(
                  'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition',
                  slot === a ? 'border-role bg-role-soft text-role-ink' : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                <Clock size={11} /> {a}
              </button>
            ))}
          </div>
        </div>

        <TextArea
          label="What should the tutor focus on?"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Electricity questions from the 2024 WAEC paper…"
        />

        {configured ? (
          <Input
            label="Confirmation email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            hint="We send the session details and a reminder here."
          />
        ) : null}

        <div className="flex items-start gap-2 rounded-xl bg-role-soft/60 p-3 text-[11px] leading-relaxed text-role-ink">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          Sessions are recorded for safety and can be reviewed by a parent in the lesson history.
        </div>
      </div>
    </Modal>
  )
}

export function TutorSummaryRow({ tutor, onBook }: { tutor: Tutor; onBook: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <Avatar emoji={tutor.emoji} color={tutor.accent} soft={tutor.soft} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-foreground">{tutor.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{tutor.subjects.join(' · ')}</p>
      </div>
      <Badge tone="warn">
        <Star size={9} className="fill-amber-500 text-amber-500" /> {tutor.rating}
      </Badge>
      <button type="button" onClick={onBook} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-role-soft text-role-ink" aria-label={`Book ${tutor.name}`}>
        <ChevronRight size={15} />
      </button>
    </div>
  )
}
