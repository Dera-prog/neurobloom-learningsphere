import { useState } from 'react'
import { CheckCircle2, Timer, UploadCloud } from 'lucide-react'
import { Badge, ProgressBar, SectionCard } from './ui'
import { useToast } from './toast'
import { useApp } from '../store/store'
import { useAuth } from '../lib/auth'
import { cn, longDate } from '../lib/utils'
import { uploadEvaluationReport, type ResolvedChild } from '../lib/parent-children'
import type { ChildId } from '../data/content'

export function DailyProgressCard({ childrenList }: { childrenList: ResolvedChild[] }) {
  const { dispatch } = useApp()
  const { user } = useAuth()
  const toast = useToast()
  const [uploading, setUploading] = useState<ChildId | null>(null)

  async function attach(slot: ChildId, file: File) {
    if (!user) {
      toast('Sign in to upload', {
        description: 'Evaluation reports are stored on your NeuroBloom account.',
        tone: 'warn',
      })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('File too large', { description: 'Choose a file smaller than 10 MB.', tone: 'warn' })
      return
    }
    setUploading(slot)
    const result = await uploadEvaluationReport(file, user.id)
    setUploading(null)
    if (!result.path) {
      toast('Upload failed', { description: result.error ?? 'Try again in a moment.', tone: 'warn' })
      return
    }
    dispatch({
      type: 'SET_CHILD_REPORT',
      child: slot,
      report: {
        name: file.name,
        size: file.size,
        type: file.type,
        path: result.path,
        uploadedAt: new Date().toISOString(),
      },
    })
    toast('Evaluation report attached', {
      description: `${file.name} is now shared with the support team.`,
      tone: 'success',
    })
  }

  return (
    <SectionCard
      title="Daily progress"
      subtitle={`${longDate()} · today’s learning at a glance`}
      icon={Timer}
      action={<Badge tone="role">{childrenList.length === 1 ? '1 child' : `${childrenList.length} children`}</Badge>}
    >
      <div className={cn('grid gap-3', childrenList.length > 1 && 'md:grid-cols-2')}>
        {childrenList.map((entry) => {
          const target = entry.daily.targetMinutes || 45
          const pct = Math.min(100, Math.round((entry.daily.minutes / target) * 100))
          return (
            <div key={entry.slot} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: entry.soft }}
                  aria-hidden
                >
                  {entry.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">{entry.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {entry.level} · {entry.daily.minutes} of {target} minutes today
                  </p>
                </div>
                <span className="text-lg font-extrabold text-foreground">{pct}%</span>
              </div>
              <div className="mt-3">
                <ProgressBar
                  value={pct}
                  color={entry.specialNeeds ? '#8b7bb0' : '#5b6574'}
                  height="h-2"
                  label={`${entry.name} learning time today`}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Lessons', value: entry.daily.lessons },
                  { label: 'Practice', value: entry.daily.practice },
                  { label: 'Streak', value: `${entry.daily.streakDays}d` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-card px-2 py-2">
                    <p className="text-sm font-extrabold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              {entry.specialNeeds ? (
                entry.report ? (
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 size={11} /> Evaluation report attached · {entry.report.name}
                  </p>
                ) : user ? (
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-2 text-[10px] font-semibold text-muted-foreground transition hover:border-role hover:text-foreground">
                    <UploadCloud size={12} />
                    {uploading === entry.slot
                      ? 'Uploading…'
                      : 'Attach evaluation report · PDF preferred, max 10 MB'}
                    <input
                      type="file"
                      className="sr-only"
                      disabled={uploading === entry.slot}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (file) void attach(entry.slot, file)
                      }}
                    />
                  </label>
                ) : null
              ) : null}
              {entry.hasHistory ? null : (
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  No activity yet — daily progress appears after the first lesson.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
