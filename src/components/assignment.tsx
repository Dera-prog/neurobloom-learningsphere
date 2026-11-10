import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  FileUp,
  Paperclip,
  Plus,
  Sparkles,
  Timer,
  X,
} from 'lucide-react'
import type { Assignment, GradingItem, Question } from '../data/content'
import { useApp } from '../store/store'
import { addDays, cn, dueLabelFor, uid } from '../lib/utils'
import { Badge, Button, Input, Modal, ProgressBar, Ring, Select, TextArea } from './ui'
import { Confetti, useToast } from './toast'

/* --------------------------------- Quiz ----------------------------------- */

export function QuizRunner({
  questions,
  totalPoints,
  onFinish,
  onDone,
  timeLimitSec,
  accent = 'var(--role-accent)',
  doneLabel = 'Done',
}: {
  questions: Question[]
  totalPoints: number
  onFinish: (score: number) => void
  onDone: () => void
  timeLimitSec?: number
  accent?: string
  doneLabel?: string
}) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1))
  const [index, setIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [left, setLeft] = useState(timeLimitSec ?? 0)
  const finished = useRef(false)
  const total = questions.length

  const correctCount = questions.reduce((count, q, i) => (answers[i] === q.correct ? count + 1 : count), 0)
  const score = total ? Math.round((correctCount / total) * totalPoints) : 0
  const percentage = total ? Math.round((correctCount / total) * 100) : 0

  const submit = () => {
    if (finished.current) return
    finished.current = true
    setSubmitted(true)
    onFinish(score)
  }

  useEffect(() => {
    if (!timeLimitSec || submitted) return
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timeLimitSec, submitted])

  useEffect(() => {
    if (timeLimitSec && left === 0 && !submitted) submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, timeLimitSec, submitted])

  if (submitted) {
    return (
      <div className="relative">
        {percentage >= 70 ? <Confetti /> : null}
        <div className="rounded-2xl border border-border bg-background/50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-role-soft text-role-ink">
            {percentage >= 70 ? <Award size={26} /> : <Sparkles size={26} />}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your result</p>
          <p className="mt-1 text-3xl font-extrabold text-foreground">
            {correctCount} <span className="text-lg font-semibold text-muted-foreground">/ {total} correct</span>
          </p>
          <p className="mt-1 text-sm font-bold" style={{ color: accent }}>
            {score} points · {percentage}%
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {percentage >= 90
              ? 'Outstanding. You have mastered this topic — challenge yourself with the next paper.'
              : percentage >= 70
                ? 'Strong work. Review the questions below and try the next practice paper.'
                : 'Good effort. Work through the review below, then give it another try.'}
          </p>
          <div className="mt-4">
            <ProgressBar value={percentage} color={accent} height="h-2" label="Quiz score" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct
            return (
              <div key={q.q} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                    )}
                  >
                    {isCorrect ? <Check size={11} /> : <X size={11} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {i + 1}. {q.q}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Your answer: <span className={isCorrect ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{q.options[answers[i]] ?? 'Not answered'}</span>
                    </p>
                    {!isCorrect ? (
                      <p className="text-[11px] text-muted-foreground">
                        Correct answer: <span className="font-semibold text-foreground">{q.options[q.correct]}</span>
                      </p>
                    ) : null}
                    {q.explain ? (
                      <p className="mt-1.5 rounded-lg bg-muted/60 px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">Why: </span>
                        {q.explain}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="role" onClick={onDone}>
            <CheckCircle2 size={15} /> {doneLabel}
          </Button>
        </div>
      </div>
    )
  }

  const current = questions[index]
  const answered = answers.filter((a) => a >= 0).length
  const clock =
    timeLimitSec !== undefined
      ? `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`
      : null

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Question {index + 1} of {total}
        </span>
        <div className="flex items-center gap-2">
          {clock ? (
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', left < 60 ? 'bg-rose-50 text-rose-700' : 'bg-muted text-muted-foreground')}>
              <Timer size={11} /> {clock}
            </span>
          ) : null}
          <span className="text-[10px] text-muted-foreground">{answered}/{total} answered</span>
        </div>
      </div>
      <ProgressBar value={((index + 1) / total) * 100} color={accent} height="h-1.5" label="Quiz progress" />

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold leading-relaxed text-foreground">
          {index + 1}. {current.q}
        </p>
        <div className="mt-3 space-y-2" role="radiogroup" aria-label={`Question ${index + 1}`}>
          {current.options.map((option, i) => {
            const selected = answers[index] === i
            return (
              <button
                type="button"
                key={option}
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((prev) => prev.map((a, idx) => (idx === index ? i : a)))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs transition',
                  selected ? 'border-role bg-role-soft font-semibold text-role-ink' : 'border-border bg-background/40 text-foreground hover:bg-muted/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                    selected ? 'border-role bg-role text-white' : 'border-border text-muted-foreground',
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ArrowLeft size={13} /> Back
        </Button>
        <div className="flex gap-1">
          {questions.map((q, i) => (
            <button
              type="button"
              key={q.q}
              onClick={() => setIndex(i)}
              aria-label={`Go to question ${i + 1}`}
              className={cn(
                'h-2 w-2 rounded-full transition',
                i === index ? 'w-5 bg-role' : answers[i] >= 0 ? 'bg-role/50' : 'bg-border',
              )}
            />
          ))}
        </div>
        {index < total - 1 ? (
          <Button variant="role" size="sm" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
            Next <ArrowRight size={13} />
          </Button>
        ) : (
          <Button variant="role" size="sm" onClick={submit}>
            Submit <Check size={13} />
          </Button>
        )}
      </div>
      {answered < total ? <p className="mt-3 text-center text-[10px] text-muted-foreground">You can still change answers before submitting.</p> : null}
    </div>
  )
}

export function QuizModal({
  open,
  onClose,
  title,
  subtitle,
  questions,
  totalPoints,
  timeLimitSec,
  onFinish,
  accent,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  questions: Question[]
  totalPoints: number
  timeLimitSec?: number
  onFinish?: (score: number) => void
  accent?: string
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} size="lg">
      {open ? (
        <QuizRunner
          questions={questions}
          totalPoints={totalPoints}
          timeLimitSec={timeLimitSec}
          accent={accent}
          onFinish={(score) => onFinish?.(score)}
          onDone={onClose}
          doneLabel="Close"
        />
      ) : null}
    </Modal>
  )
}

/* ------------------------------ Assignment -------------------------------- */

export function AssignmentModal({ assignmentId, open, onClose }: { assignmentId: string | null; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const assignment = state.assignments.find((a) => a.id === assignmentId) ?? null
  const [mode, setMode] = useState<'detail' | 'quiz'>('detail')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    if (!open) return
    setMode('detail')
    setText('')
    setFileName('')
  }, [open, assignmentId])

  if (!assignment) return null

  const submitText = () => {
    if (text.trim().length < 20 && !fileName) {
      toast('Add a little more first', { description: 'Type at least 20 characters or attach a document.', tone: 'warn' })
      return
    }
    dispatch({ type: 'SUBMIT_ASSIGNMENT', id: assignment.id, autoGraded: false, text, fileName })
    toast('Assignment submitted', { description: 'Your teacher will review it and send feedback.', tone: 'success' })
  }

  const statusBadge =
    assignment.status === 'pending' ? (
      <Badge tone="warn" className="gap-1"><Clock size={10} /> {assignment.dueLabel}</Badge>
    ) : assignment.status === 'submitted' ? (
      <Badge tone="sky" className="gap-1"><CheckCircle2 size={10} /> Submitted</Badge>
    ) : (
      <Badge tone="success" className="gap-1"><CheckCircle2 size={10} /> {assignment.score}/{assignment.points}</Badge>
    )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'quiz' ? 'Chapter quiz' : assignment.title}
      subtitle={`${assignment.subject} · ${assignment.type} · ${assignment.points} points`}
      size="lg"
      footer={
        mode === 'quiz' ? null : assignment.status === 'pending' ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">{assignment.autoGrade ? 'Auto-graded instantly' : 'Reviewed by your teacher'}</span>
            {assignment.autoGrade && assignment.questions ? (
              <Button variant="role" onClick={() => setMode('quiz')}>
                Start quiz <ArrowRight size={14} />
              </Button>
            ) : (
              <Button variant="role" onClick={submitText}>
                <FileUp size={14} /> Submit assignment
              </Button>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )
      }
    >
      {mode === 'quiz' && assignment.questions ? (
        <QuizRunner
          questions={assignment.questions}
          totalPoints={assignment.points}
          accent={assignment.subjectColor}
          onFinish={(score) => {
            dispatch({ type: 'SUBMIT_ASSIGNMENT', id: assignment.id, autoGraded: true, score })
            toast('Quiz submitted', { description: `You scored ${score}/${assignment.points}. Points added!`, tone: 'success' })
          }}
          onDone={onClose}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: assignment.subjectColor }} /> {assignment.subject}
            </Badge>
            <Badge tone="neutral">{assignment.points} points</Badge>
            {statusBadge}
          </div>

          <p className="text-sm leading-relaxed text-foreground">{assignment.description}</p>

          {assignment.instructions ? (
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Instructions</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{assignment.instructions}</p>
            </div>
          ) : null}

          {assignment.status === 'pending' && assignment.autoGrade && assignment.questions ? (
            <div className="rounded-xl border border-border bg-role-soft/50 p-4">
              <p className="text-xs font-bold text-foreground">{assignment.questions.length} questions · about 5 minutes</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                You can move between questions before submitting. Your score is added to your total points straight away.
              </p>
            </div>
          ) : null}

          {assignment.status === 'pending' && !assignment.autoGrade ? (
            <div className="space-y-3">
              <TextArea
                label="Your answer"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your answer here…"
                hint={`${text.trim().length} characters`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted">
                  <Paperclip size={14} />
                  {fileName || 'Attach a PDF or image'}
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                    aria-label="Attach a file"
                  />
                </label>
                {fileName ? (
                  <button type="button" onClick={() => setFileName('')} className="text-[11px] font-semibold text-destructive">
                    Remove file
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {assignment.status === 'submitted' ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <CheckCircle2 size={14} /> Submitted {assignment.submittedAt ?? ''}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-sky-800/80">
                Your teacher will review this and send feedback. You earned 5 points for submitting on time.
              </p>
              {assignment.answerText ? (
                <div className="mt-2 rounded-lg bg-white/70 p-2.5 text-[11px] leading-relaxed text-foreground">
                  {assignment.answerText}
                </div>
              ) : null}
              {assignment.attachmentName ? (
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-sky-900">
                  <Paperclip size={11} /> {assignment.attachmentName}
                </p>
              ) : null}
            </div>
          ) : null}

          {assignment.status === 'graded' ? (
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Ring value={assignment.points ? Math.round(((assignment.score ?? 0) / assignment.points) * 100) : 100} size={82} stroke={8} color={assignment.subjectColor}>
                  <span className="text-base font-extrabold text-foreground">
                    {assignment.score}/{assignment.points}
                  </span>
                  <span className="text-[9px] text-muted-foreground">score</span>
                </Ring>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground">Teacher feedback</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {assignment.feedback ?? 'Excellent work. Keep practising the questions you found tricky.'}
                  </p>
                </div>
              </div>
              {assignment.answerText ? (
                <div className="mt-3 rounded-lg border border-border bg-card p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  {assignment.answerText}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  )
}

/* --------------------------------- Grade ---------------------------------- */

export function GradeModal({ item, open, onClose }: { item: GradingItem | null; open: boolean; onClose: () => void }) {
  const { dispatch } = useApp()
  const toast = useToast()
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!open || !item) return
    setScore(Math.round(item.total * 0.8))
    setFeedback('Strong work overall. Your method is clear — review the final step and show all units next time.')
  }, [open, item])

  if (!item) return null

  const save = () => {
    dispatch({ type: 'GRADE_SUBMISSION', queueId: item.id, score, feedback })
    toast('Submission graded', { description: `${item.student} received ${score}/${item.total} and your feedback.`, tone: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Grade submission"
      subtitle={`${item.title} · ${item.context}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">{item.student} will get a notification immediately.</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="role" size="sm" onClick={save}>
              <Check size={13} /> Save grade
            </Button>
          </div>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg">🎓</div>
        <div>
          <p className="text-sm font-bold text-foreground">{item.student}</p>
          <p className="text-[11px] text-muted-foreground">
            Submitted {item.submitted} · {item.total} points available
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-background/50 p-3">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted work</p>
        <p className="text-xs leading-relaxed text-foreground">
          “I started by factoring the numerator, then cancelled the common term. For the derivative I applied the power rule and checked each term. The final answer is shown with the working attached.”
        </p>
        <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-role-ink">
          <Paperclip size={11} /> {item.student.toLowerCase().replace(/\s+/g, '-')}-submission.pdf
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr]">
        <div>
          <Input
            label="Score"
            type="number"
            min={0}
            max={item.total}
            value={score}
            onChange={(e) => setScore(Math.max(0, Math.min(item.total, Number(e.target.value))))}
            hint={`out of ${item.total}`}
          />
          <input
            type="range"
            min={0}
            max={item.total}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="mt-3 w-full"
            aria-label="Score slider"
          />
        </div>
        <TextArea
          label="Feedback"
          rows={5}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share something specific and encouraging…"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Well done!', 'Show your working', 'Review the final step', 'Great improvement'].map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            onClick={() => setFeedback((f) => (f ? `${f} ${suggestion}.` : `${suggestion}.`))}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-role/30 hover:text-role-ink"
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </Modal>
  )
}

/* --------------------------- Create assignment ---------------------------- */

const subjectColors: Record<string, string> = {
  Mathematics: '#6c3fc5',
  'Further Mathematics': '#6c3fc5',
  English: '#0ea5e9',
  Physics: '#10b981',
  Chemistry: '#f59e0b',
  Biology: '#ec4899',
  Government: '#8b5cf6',
  Numeracy: '#ec4899',
}

export function CreateAssignmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useApp()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [level, setLevel] = useState('JSS2')
  const [points, setPoints] = useState(20)
  const [type, setType] = useState('Problem Set')
  const [dueIn, setDueIn] = useState(3)
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle('')
    setSubject('Mathematics')
    setLevel('JSS2')
    setPoints(20)
    setType('Problem Set')
    setDueIn(3)
    setInstructions('')
  }, [open])

  const create = () => {
    if (!title.trim()) {
      toast('Give the assignment a title', { tone: 'warn' })
      return
    }
    const date = addDays(dueIn)
    const assignment: Assignment = {
      id: uid('asg'),
      title: title.trim(),
      subject,
      subjectColor: subjectColors[subject] ?? '#6c3fc5',
      points,
      dueDate: date.toISOString(),
      dueLabel: dueLabelFor(date),
      type,
      description: instructions.trim() || `New ${type.toLowerCase()} set by Dr. Kelechi Azu for ${level}.`,
      instructions: instructions.trim() || undefined,
      autoGrade: false,
      status: 'pending',
      stage: level.startsWith('JSS') ? 'junior' : 'senior',
    }
    dispatch({ type: 'CREATE_ASSIGNMENT', assignment, level })
    toast('Assignment published', { description: `${title.trim()} is now live for ${level}.`, tone: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create assignment"
      subtitle="It will appear in your students’ dashboards immediately."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="role" size="sm" onClick={create}>
            <Plus size={13} /> Publish assignment
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Input label="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quadratic equations practice" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {Object.keys(subjectColors).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select label="Class" value={level} onChange={(e) => setLevel(e.target.value)}>
            {['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            {['Problem Set', 'Essay', 'Lab Report', 'Worksheet', 'Quiz', 'Project'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Input
            label="Points"
            type="number"
            min={5}
            max={100}
            value={points}
            onChange={(e) => setPoints(Math.max(5, Math.min(100, Number(e.target.value))))}
          />
          <Select label="Due in" value={dueIn} onChange={(e) => setDueIn(Number(e.target.value))}>
            {[1, 2, 3, 5, 7, 14].map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? 'day' : 'days'}
              </option>
            ))}
          </Select>
        </div>
        <TextArea
          label="Instructions"
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Explain what students need to do…"
        />
      </div>
    </Modal>
  )
}

/* ----------------------------- Create class ------------------------------- */

export function CreateClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useApp()
  const toast = useToast()
  const [name, setName] = useState('')
  const [level, setLevel] = useState('JSS2')
  const [time, setTime] = useState('5:00 PM')
  const [duration, setDuration] = useState('1 hr')

  useEffect(() => {
    if (!open) return
    setName('')
    setLevel('JSS2')
    setTime('5:00 PM')
    setDuration('1 hr')
  }, [open])

  const create = () => {
    if (!name.trim()) {
      toast('Add a class name', { tone: 'warn' })
      return
    }
    dispatch({
      type: 'CREATE_CLASS',
      klass: {
        id: uid('class'),
        name: name.trim(),
        level,
        subject: 'Mathematics',
        color: '#10b981',
        soft: '#ecfdf5',
        students: 0,
        time,
        duration,
        status: 'upcoming',
      },
    })
    toast('Class scheduled', { description: `${name.trim()} · ${level} · ${time}`, tone: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New live class"
      subtitle="Schedule a class and invite your students."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="role" size="sm" onClick={create}>
            <Plus size={13} /> Schedule class
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Input label="Class name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JSS2 Algebra Clinic" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select label="Level" value={level} onChange={(e) => setLevel(e.target.value)}>
            {['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3', 'Special'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
          <Input label="Start time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Select label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
            {['45 min', '1 hr', '1.5 hrs', '2 hrs'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Students receive a notification and the class appears on their timetable. Live rooms include captions, chat and hand-raising.
        </div>
      </div>
    </Modal>
  )
}
