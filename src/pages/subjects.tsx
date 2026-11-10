import { useMemo, useState } from 'react'
import { BookOpen, ClipboardList, Layers, Sparkles } from 'lucide-react'
import { HeaderActions, RoleLayout } from '../components/layout'
import { SubjectCard, SubjectExplorerModal, SubjectLibraryHeader } from '../components/curriculum'
import { Badge, Card, PageHeader, ProgressBar, StatCard, SearchField } from '../components/ui'
import { curriculumFor, type SubjectCurriculum } from '../data/curriculum'
import { useApp } from '../store/store'
import { cn } from '../lib/utils'

function SubjectsView({ stage }: { stage: 'junior' | 'senior' }) {
  const { state } = useApp()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<SubjectCurriculum | null>(null)

  const subjects = useMemo(() => curriculumFor(stage), [stage])
  const topicCount = subjects.reduce((sum, subject) => sum + subject.topics.length, 0)
  const questionCount = subjects.reduce(
    (sum, subject) => sum + subject.topics.reduce((inner, topic) => inner + topic.questions.length, 0),
    0,
  )
  const practised = subjects.reduce(
    (sum, subject) => sum + subject.topics.filter((topic) => state.quizScores[topic.id] !== undefined).length,
    0,
  )
  const progress = topicCount ? Math.round((practised / topicCount) * 100) : 0
  const searched = query.trim().toLowerCase()
  const visible = searched
    ? subjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searched) ||
          subject.blurb.toLowerCase().includes(searched) ||
          subject.topics.some(
            (topic) =>
              topic.title.toLowerCase().includes(searched) || topic.realLife.toLowerCase().includes(searched),
          ),
      )
    : subjects

  return (
    <RoleLayout role={stage}>
      <PageHeader
        title="Subjects & topics"
        subtitle="Real-life lessons with worked examples and practice questions"
        badge={<Badge tone="role">{topicCount} topics</Badge>}
        actions={<HeaderActions role={stage} />}
      />
      <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Subjects"
            value={subjects.length}
            icon={BookOpen}
            color="#6c3fc5"
            soft="#f0eefb"
            sub={stage === 'junior' ? 'JSS1 – JSS3' : 'SSS1 – SSS3'}
          />
          <StatCard label="Real-life topics" value={topicCount} icon={Layers} color="#0ea5e9" soft="#e8f4fd" sub="Market, home, road" />
          <StatCard label="Practice questions" value={questionCount} icon={ClipboardList} color="#10b981" soft="#ecfdf5" sub="With answers" />
          <StatCard label="Topics practised" value={`${practised}/${topicCount}`} icon={Sparkles} color="#f59e0b" soft="#fffbeb" sub={`${progress}% complete`} />
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Your topic progress</p>
              <p className="text-[11px] text-muted-foreground">
                Practise a topic quiz to record a best score. Scores stay with your account.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={progress} height="h-2" label="Topic progress" />
                <span className="shrink-0 text-[11px] font-bold text-foreground">{progress}%</span>
              </div>
            </div>
            <SearchField value={query} onChange={setQuery} placeholder="Search a subject or topic" className="w-full sm:w-64" />
          </div>
        </Card>

        <SubjectLibraryHeader stage={stage} />

        {visible.length ? (
          <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3')}>
            {visible.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} scores={state.quizScores} onOpen={() => setActive(subject)} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            No subject matches “{query}”. Try a topic name like “profit” or “malaria”.
          </p>
        )}
      </div>

      <SubjectExplorerModal subject={active} open={Boolean(active)} onClose={() => setActive(null)} />
    </RoleLayout>
  )
}

export function JuniorSubjects() {
  return <SubjectsView stage="junior" />
}

export function SeniorSubjects() {
  return <SubjectsView stage="senior" />
}
