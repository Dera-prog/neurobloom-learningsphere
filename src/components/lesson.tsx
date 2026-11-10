import { useEffect, useRef, useState } from 'react'
import {
  Captions,
  CaptionsOff,
  Check,
  CheckCircle2,
  Download,
  Hand,
  Mic,
  MicOff,
  Pause,
  Play,
  ScreenShare,
  ScreenShareOff,
  Send,
  Square,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Activity, ChatMessage } from '../data/content'
import { useApp } from '../store/store'
import { cn, downloadText } from '../lib/utils'
import { Avatar, Badge, Button, Modal, ProgressBar } from './ui'
import { Confetti, useToast } from './toast'

/* ------------------------------- Live room -------------------------------- */

export function LiveRoomModal({
  open,
  onClose,
  title,
  teacher,
  teacherRole,
  participants,
  accent = '#6c3fc5',
  soft = '#f0eefb',
  host = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  teacher: string
  teacherRole: string
  participants: number
  accent?: string
  soft?: string
  host?: boolean
}) {
  const toast = useToast()
  const [mic, setMic] = useState(false)
  const [camera, setCamera] = useState(false)
  const [hand, setHand] = useState(false)
  const [captions, setCaptions] = useState(true)
  const [sound, setSound] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'lr1', author: teacher, text: 'Welcome everyone! We’ll begin in a moment.', time: 'Now', staff: true },
    { id: 'lr2', author: 'Chioma A.', text: 'Good morning! 👋', time: 'Now', avatar: '🦁' },
  ])
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setElapsed(0)
    setMic(false)
    setCamera(false)
    setHand(false)
    setCaptions(true)
    setSound(true)
    setSharing(false)
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [open])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  const sendChat = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: `l-${Date.now()}`, author: 'You', text, time: 'Now', mine: true }])
    setDraft('')
  }

  const toggleMic = () => {
    const next = !mic
    setMic(next)
    toast(next ? 'Microphone on' : 'Microphone muted', { tone: 'info' })
  }

  const toggleCamera = () => {
    const next = !camera
    setCamera(next)
    toast(next ? 'Camera on' : 'Camera off', { tone: 'info' })
  }

  const toggleHand = () => {
    const next = !hand
    setHand(next)
    toast(next ? 'Hand raised — your teacher will see it' : 'Hand lowered', { tone: 'info' })
  }

  const toggleShare = () => {
    const next = !sharing
    setSharing(next)
    toast(next ? 'Sharing your screen' : 'Stopped sharing', {
      description: next ? 'Everyone in the class can see it.' : undefined,
      tone: 'info',
    })
  }

  const toggleSound = () => {
    const next = !sound
    setSound(next)
    toast(next ? 'Class audio on' : 'Class audio muted', { tone: 'info' })
  }

  const toggleCaptions = () => {
    const next = !captions
    setCaptions(next)
    toast(next ? 'Captions on' : 'Captions off', { tone: 'info' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={`${host ? 'You are hosting' : 'Live class'} · ${clock}`}
      size="xl"
      footer={
        host ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">{participants} students · attendance is being recorded</p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                toast('Class ended', { description: 'Attendance and the recording were saved.', tone: 'success' })
                onClose()
              }}
            >
              <Square size={12} /> End class
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">Recording and captions are on for this class.</p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                toast('You left the class', { tone: 'info' })
                onClose()
              }}
            >
              Leave class
            </Button>
          </div>
        )
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
        <div>
          <div
            className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${accent} 0%, #241a44 70%)` }}
          >
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
              </span>
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-semibold text-white">{participants + 1} here</span>
            </div>
            <div className="absolute right-3 top-3 flex gap-1">
              <button
                type="button"
                onClick={toggleCaptions}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-lg text-white backdrop-blur transition before:absolute before:-inset-1 before:content-[""] active:scale-95',
                  captions ? 'bg-white/25' : 'bg-red-500/80',
                )}
                aria-label={captions ? 'Turn captions off' : 'Turn captions on'}
                aria-pressed={captions}
                title={captions ? 'Turn captions off' : 'Turn captions on'}
              >
                {captions ? <Captions size={15} /> : <CaptionsOff size={15} />}
              </button>
              <button
                type="button"
                onClick={toggleSound}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-lg text-white backdrop-blur transition before:absolute before:-inset-1 before:content-[""] active:scale-95',
                  sound ? 'bg-white/25' : 'bg-red-500/80',
                )}
                aria-label={sound ? 'Mute class audio' : 'Turn class audio on'}
                aria-pressed={sound}
                title={sound ? 'Mute class audio' : 'Turn class audio on'}
              >
                {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
            <div className={cn('text-center', captions && 'pb-20')}>
              <Avatar emoji="👩‍🏫" color={accent} soft="rgba(255,255,255,0.18)" size="xl" ring />
              <p className="mt-3 text-sm font-bold text-white">{teacher}</p>
              <p className="text-[11px] text-white/65">{teacherRole}</p>
            </div>
            {captions ? (
              <div className="absolute inset-x-4 bottom-4 rounded-xl bg-black/45 px-4 py-2 text-center text-xs text-white backdrop-blur-sm">
                “Let’s work through an example together — follow along in your notes.”
              </div>
            ) : null}
            {sharing ? (
              <div
                className={cn(
                  'absolute left-4 flex items-center gap-1.5 rounded-full bg-role/90 px-3 py-1 text-[10px] font-bold text-white backdrop-blur',
                  captions ? 'bottom-[86px]' : 'bottom-16',
                )}
              >
                <ScreenShare size={12} /> You’re sharing your screen
              </div>
            ) : null}
            {hand ? (
              <div
                className={cn(
                  'absolute right-4 flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold text-amber-950',
                  captions ? 'bottom-[86px]' : 'bottom-4',
                )}
              >
                <Hand size={12} /> Hand raised
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ControlButton active={mic} offTone="danger" onClick={toggleMic} label={mic ? 'Mute microphone' : 'Unmute microphone'}>
                {mic ? <Mic size={16} /> : <MicOff size={16} />}
              </ControlButton>
              <ControlButton active={camera} offTone="danger" onClick={toggleCamera} label={camera ? 'Turn camera off' : 'Turn camera on'}>
                {camera ? <Video size={16} /> : <VideoOff size={16} />}
              </ControlButton>
              <ControlButton active={hand} activeTone="hand" onClick={toggleHand} label={hand ? 'Lower hand' : 'Raise hand'}>
                <Hand size={16} />
              </ControlButton>
              <ControlButton active={sharing} onClick={toggleShare} label={sharing ? 'Stop sharing screen' : 'Share screen'}>
                {sharing ? <ScreenShare size={16} /> : <ScreenShareOff size={16} />}
              </ControlButton>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connection good
            </div>
          </div>
        </div>

        <div className="flex h-[320px] flex-col rounded-2xl border border-border bg-background/50 lg:h-auto">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <p className="text-xs font-bold text-foreground">Class chat</p>
            <Badge tone="neutral">{messages.length}</Badge>
          </div>
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
            {messages.map((m) => (
              <div key={m.id} className={cn('text-[11px]', m.mine && 'text-right')}>
                {!m.mine ? <p className="mb-0.5 font-bold text-foreground">{m.author}</p> : null}
                <p
                  className={cn(
                    'inline-block rounded-xl px-2.5 py-1.5 text-left leading-relaxed break-words whitespace-pre-wrap',
                    m.mine ? 'bg-role text-white' : 'border border-border bg-card text-muted-foreground',
                  )}
                >
                  {m.text}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-t border-border p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChat()
              }}
              placeholder="Message the class"
              aria-label="Message the class"
              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-card px-2.5 text-[11px] outline-none focus:border-primary/40"
            />
            <button
              type="button"
              onClick={sendChat}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-role text-white disabled:opacity-40"
              disabled={!draft.trim()}
              aria-label="Send chat message"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ControlButton({
  active,
  onClick,
  label,
  offTone,
  activeTone = 'role',
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  offTone?: 'danger'
  activeTone?: 'role' | 'hand'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-role/40 active:scale-95',
        active
          ? activeTone === 'hand'
            ? 'border-transparent bg-amber-400 text-amber-950 shadow-sm'
            : 'border-transparent bg-role text-white shadow-sm'
          : offTone === 'danger'
            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-border bg-card text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------ Lesson player ----------------------------- */

export function LessonPlayerModal({
  open,
  onClose,
  lesson,
}: {
  open: boolean
  onClose: () => void
  lesson: { title: string; subject: string; instructor: string; duration: string; progress?: number; color?: string; soft?: string } | null
}) {
  const { dispatch } = useApp()
  const toast = useToast()
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(lesson?.progress ?? 0)
  const [speed, setSpeed] = useState('1x')
  const [completed, setCompleted] = useState((lesson?.progress ?? 0) >= 100)

  useEffect(() => {
    if (!open) return
    setProgress(lesson?.progress ?? 0)
    setCompleted((lesson?.progress ?? 0) >= 100)
    setPlaying(false)
    setSpeed('1x')
  }, [open, lesson])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id)
          setPlaying(false)
          return 100
        }
        return Math.min(100, p + 1.5)
      })
    }, 500)
    return () => clearInterval(id)
  }, [playing])

  if (!lesson) return null
  const color = lesson.color ?? '#6c3fc5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lesson.title}
      subtitle={`${lesson.subject} · ${lesson.instructor} · ${lesson.duration}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">{completed ? 'Lesson complete — well done!' : 'Your progress saves automatically.'}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadText(
                  `${lesson.subject.toLowerCase()}-notes.txt`,
                  `${lesson.title}\n${lesson.subject} · ${lesson.instructor}\n\n1. Key idea\n2. Worked example\n3. Practice questions\n\nDownloaded from NeuroBloom LearningSphere.`,
                )
                toast('Lesson notes downloaded', { tone: 'success' })
              }}
            >
              <Download size={13} /> Notes
            </Button>
            <Button
              variant="role"
              size="sm"
              disabled={completed}
              onClick={() => {
                setCompleted(true)
                setProgress(100)
                dispatch({ type: 'ADD_POINTS', amount: 5 })
                toast('Lesson marked complete', { description: '+5 points added to your total.', tone: 'success' })
              }}
            >
              <Check size={13} /> {completed ? 'Completed' : 'Mark complete'}
            </Button>
          </div>
        </div>
      }
    >
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl"
        style={{ background: `linear-gradient(140deg, ${color} 0%, #1d1838 75%)` }}
      >
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20">
          <div className="h-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#1a1535] shadow-xl transition hover:scale-105"
          aria-label={playing ? 'Pause lesson' : 'Play lesson'}
        >
          {playing ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <span className="absolute left-4 top-4 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-semibold text-white">
          {lesson.subject} · Recorded
        </span>
        <span className="absolute bottom-4 right-4 text-[10px] font-semibold text-white/80">{Math.round(progress)}% watched</span>
      </div>

      <div className="mt-4 space-y-3">
        <ProgressBar value={progress} color={color} height="h-2" label="Lesson progress" />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {playing ? 'Playing lesson…' : progress >= 100 ? 'Completed' : `Resume from ${Math.round(progress)}%`}
          </p>
          <div className="flex gap-1">
            {['0.75x', '1x', '1.25x', '1.5x'].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  'rounded-md px-2 py-1 text-[10px] font-semibold transition',
                  speed === s ? 'bg-role-soft text-role-ink' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/50 p-3">
          <p className="mb-2 text-[11px] font-bold text-foreground">Chapters</p>
          <div className="space-y-1.5">
            {[
              { label: 'Introduction', at: 0 },
              { label: 'Worked example', at: 35 },
              { label: 'Practice together', at: 65 },
              { label: 'Recap & quiz', at: 90 },
            ].map((chapter) => (
              <button
                type="button"
                key={chapter.label}
                onClick={() => setProgress(chapter.at)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition',
                  progress >= chapter.at ? 'text-foreground' : 'text-muted-foreground',
                  'hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-2">
                  {progress > chapter.at ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Play size={10} />}
                  {chapter.label}
                </span>
                <span>{chapter.at}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* -------------------------------- Activity -------------------------------- */

export function ActivityModal({
  open,
  onClose,
  activity,
}: {
  open: boolean
  onClose: () => void
  activity: Activity | null
}) {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [checked, setChecked] = useState<number[]>([])
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  const alreadyDone = activity ? state.completedActivities.includes(activity.id) : false

  useEffect(() => {
    if (!open || !activity) return
    setChecked([])
    setSeconds(activity.minutes * 60)
    setRunning(false)
    setFinished(false)
  }, [open, activity])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id)
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  if (!activity) return null

  const done = finished || alreadyDone
  const complete = () => {
    if (!alreadyDone) {
      dispatch({ type: 'COMPLETE_ACTIVITY', id: activity.id, minutes: activity.minutes, points: activity.reward })
      toast('Activity complete!', { description: `+${activity.reward} points · ${activity.minutes} minutes of calm growth.`, tone: 'success' })
    }
    setFinished(true)
    setRunning(false)
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <Modal open={open} onClose={onClose} title={activity.title} subtitle={`${activity.minutes} minutes · ${activity.tag}`} size="md" tone="calm">
      <div className="relative overflow-hidden rounded-2xl border border-border p-5 text-center" style={{ background: activity.soft }}>
        {done ? <Confetti /> : null}
        <div className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm', !state.preferences.reduceMotion && 'animate-float')}>
          {activity.emoji}
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">{activity.description}</p>
        {done ? (
          <p className="mt-2 text-xs font-bold" style={{ color: activity.color }}>
            {alreadyDone && !finished ? 'You have already finished this activity. You can do it again any time.' : `Wonderful! +${activity.reward} points`}
          </p>
        ) : (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold tabular-nums text-foreground">{clock}</span>
            <Button variant="outline" size="sm" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause size={13} /> : <Play size={13} />} {running ? 'Pause' : 'Start timer'}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold text-foreground">Let’s do it together</p>
        <div className="space-y-2">
          {activity.steps.map((step, index) => {
            const isChecked = checked.includes(index)
            return (
              <button
                type="button"
                key={step}
                onClick={() => setChecked((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                  isChecked ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs',
                    isChecked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border text-muted-foreground',
                  )}
                >
                  {isChecked ? <Check size={12} /> : index + 1}
                </span>
                <span className={cn('text-xs leading-relaxed', isChecked ? 'text-foreground' : 'text-muted-foreground')}>{step}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">No rush. You can stop whenever you need.</p>
        <Button variant="role" onClick={complete} disabled={finished}>
          <CheckCircle2 size={15} /> {finished ? 'Finished' : alreadyDone ? 'Do it again' : 'I finished this activity'}
        </Button>
      </div>
    </Modal>
  )
}
