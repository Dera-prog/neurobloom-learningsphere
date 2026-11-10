import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Lightbulb,
  PencilLine,
  Target,
  Trophy,
} from 'lucide-react'
import type { SubjectCurriculum, Topic } from '../data/curriculum'
import { useApp } from '../store/store'
import { cn } from '../lib/utils'
import { Badge, Button, Modal, ProgressBar } from './ui'
import { QuizRunner } from './assignment'
import { useToast } from './toast'

function bestFor(scores: Record<string, number>, topic: Topic) {
  return scores[topic.id]
}

export function SubjectExplorerModal({
  subject,
  open,
  onClose,
}: {
  subject: SubjectCurriculum | null
  open: boolean
  onClose: () => void
}) {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [openTopic, setOpenTopic] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<Topic | null>(null)

  useEffect(() => {
    if (!open) return
    setOpenTopic(null)
    setQuiz(null)
  }, [open, subject?.id])

  if (!subject) return null

  const done = subject.topics.filter((topic) => bestFor(state.quizScores, topic) !== undefined).length
  const progress = subject.topics.length ? Math.round((done / subject.topics.length) * 100) : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quiz ? quiz.title : subject.name}
      subtitle={
        quiz
          ? 'Practice quiz · answers explained at the end'
          : `${subject.stage === 'junior' ? 'Junior secondary' : 'Senior secondary'} · ${subject.topics.length} real-life topics`
      }
      size="lg"
      footer={
        quiz ? null : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {done} of {subject.topics.length} topics practised
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )
      }
    >
      {quiz ? (
        <QuizRunner
          questions={quiz.questions}
          totalPoints={100}
          accent={subject.color}
          onFinish={(score) => {
            dispatch({ type: 'SAVE_QUIZ_SCORE', quizId: quiz.id, score })
            toast('Practice saved', {
              description: `${quiz.title}: ${score}%. Your best score is kept.`,
              tone: 'success',
            })
          }}
          onDone={() => setQuiz(null)}
          doneLabel="Back to topics"
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: subject.soft }}
                aria-hidden
              >
                {subject.emoji}
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">{subject.blurb}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <ProgressBar value={progress} color={subject.color} height="h-1.5" label={`${subject.name} topic progress`} />
              <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{progress}%</span>
            </div>
          </div>

          {subject.topics.map((topic, index) => {
            const expanded = openTopic === topic.id
            const best = bestFor(state.quizScores, topic)
            return (
              <div key={topic.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenTopic(expanded ? null : topic.id)}
                  aria-expanded={expanded}
                  aria-controls={`topic-${topic.id}`}
                  className="flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-muted/50"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold"
                    style={{ background: subject.soft, color: subject.color }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">{topic.title}</span>
                      {best !== undefined ? (
                        <Badge tone="success" className="gap-1">
                          <Trophy size={10} /> {best}%
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      {topic.realLife}
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn('mt-1 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                    aria-hidden
                  />
                </button>

                {expanded ? (
                  <div id={`topic-${topic.id}`} className="space-y-3 border-t border-border px-3.5 py-3.5">
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Lightbulb size={12} /> Key ideas
                      </p>
                      <ul className="space-y-1.5">
                        {topic.keyIdeas.map((idea) => (
                          <li key={idea} className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground">
                            <Check size={12} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <PencilLine size={12} /> Worked example
                      </p>
                      <p className="text-[11px] font-semibold text-foreground">{topic.worked.prompt}</p>
                      <ol className="mt-2 space-y-1">
                        {topic.worked.steps.map((step, stepIndex) => (
                          <li key={step} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                            <span className="font-bold text-foreground">{stepIndex + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold" style={{ background: subject.soft, color: subject.color }}>
                        {topic.worked.answer}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {best !== undefined ? `Best score ${best}%` : `${topic.questions.length} questions · not attempted`}
                      </span>
                      <Button variant="role" size="sm" onClick={() => setQuiz(topic)}>
                        {best !== undefined ? 'Practise again' : 'Start practice'} <ArrowRight size={13} />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

export function SubjectCard({
  subject,
  scores,
  onOpen,
}: {
  subject: SubjectCurriculum
  scores: Record<string, number>
  onOpen: () => void
}) {
  const done = subject.topics.filter((topic) => scores[topic.id] !== undefined).length
  const progress = subject.topics.length ? Math.round((done / subject.topics.length) * 100) : 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-[0_1px_2px_rgba(26,21,53,0.03)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(26,21,53,0.3)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: subject.soft }} aria-hidden>
          {subject.emoji}
        </span>
        <Badge tone="neutral">{subject.topics.length} topics</Badge>
      </div>
      <p className="mt-3 text-sm font-extrabold text-foreground">{subject.name}</p>
      <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">{subject.blurb}</p>
      <div className="mt-3 flex items-center gap-2">
        <ProgressBar value={progress} color={subject.color} height="h-1.5" label={`${subject.name} progress`} />
        <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{progress}%</span>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: subject.color }}>
        Open topics <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

export function SubjectLibraryHeader({ stage }: { stage: 'junior' | 'senior' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
      <BookOpen size={14} className="text-role" aria-hidden />
      {stage === 'junior'
        ? 'Every topic starts with something you meet at home, in the market or on the road.'
        : 'Every topic is written around a real situation and the WAEC skills behind it.'}
      <Target size={13} className="ml-auto shrink-0 text-role" aria-hidden />
    </div>
  )
}
