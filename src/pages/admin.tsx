import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  HeartHandshake,
  MessageCircle,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { HeaderActions, RoleLayout } from '../components/layout'
import { Donut, GroupedBars, TrendArea } from '../components/charts'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  ProgressBar,
  SectionCard,
  Select,
  StatCard,
  Tabs,
} from '../components/ui'
import { useToast } from '../components/toast'
import { useAuth } from '../lib/auth'
import { naira } from '../lib/utils'
import { plans, type PlanId } from '../data/content'
import {
  platformCategories,
  platformStats,
  retentionCohorts,
  revenueTrend,
  seedAdminUsers,
  seedLedger,
  seedPayouts,
  seedReviews,
  seedSubscriptions,
  studentGrowth,
  teacherGrowth,
  teacherPerformance,
  weeklyActivity,
  type AdminLedgerRow,
  type AdminPayout,
  type AdminReview,
  type AdminSubscription,
  type AdminUser,
} from '../data/admin'
import {
  customerGrowth,
  productCategoryShare,
  productSalesStats,
  salesTrend,
  seedAdminTasks,
  seedProducts,
} from '../data/admin-ops'

/* ------------------------------ Local state ------------------------------- */

interface AdminData {
  users: AdminUser[]
  reviews: AdminReview[]
  payouts: AdminPayout[]
  ledger: AdminLedgerRow[]
  subscriptions: AdminSubscription[]
  categories: string[]
}

const ADMIN_KEY = 'neurobloom:admin:v1'

function seedAdminData(): AdminData {
  return {
    users: seedAdminUsers.map((u) => ({ ...u })),
    reviews: seedReviews.map((r) => ({ ...r })),
    payouts: seedPayouts.map((p) => ({ ...p })),
    ledger: seedLedger.map((l) => ({ ...l })),
    subscriptions: seedSubscriptions.map((s) => ({ ...s })),
    categories: [...platformCategories],
  }
}

function loadAdminData(): AdminData {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    if (!raw) return seedAdminData()
    const parsed = JSON.parse(raw) as Partial<AdminData>
    if (!parsed || !Array.isArray(parsed.users)) return seedAdminData()
    const seed = seedAdminData()
    return { ...seed, ...parsed }
  } catch {
    return seedAdminData()
  }
}

function useAdminData() {
  const [data, setData] = useState<AdminData>(loadAdminData)
  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data))
    } catch {
      // Private browsing can block storage; the console still works in memory.
    }
  }, [data])
  return [data, setData] as const
}

/* -------------------------------- Helpers --------------------------------- */

const planName = (id: PlanId) => plans.find((p) => p.id === id)?.name ?? id

function roleLabel(kind: AdminUser['kind']) {
  if (kind === 'teacher') return 'Teacher'
  if (kind === 'specialist') return 'Specialist'
  if (kind === 'student') return 'Student'
  return 'Parent'
}

function statusTone(status: AdminUser['status']) {
  if (status === 'active') return 'success' as const
  if (status === 'pending') return 'warn' as const
  return 'danger' as const
}

function ReviewIcon({ kind }: { kind: AdminReview['kind'] }) {
  const map = {
    lesson: GraduationCap,
    resource: FileText,
    discussion: MessageCircle,
  } as const
  const Icon = map[kind]
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-role-soft text-role-ink">
      <Icon size={16} aria-hidden />
    </span>
  )
}

/* ------------------------------- Chrome ----------------------------------- */

function PreviewNotice() {
  const { configured, profile } = useAuth()
  if (!configured || profile?.role === 'admin') return null
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-amber-900">Preview mode — you are not signed in as an administrator</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
          You can explore the console with sample platform data. Approvals, refunds and other actions only change this
          browser. Ask a super admin to grant your account the <span className="font-semibold">admin</span> role for full
          access.
        </p>
      </div>
    </div>
  )
}

export function ConsolePage({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string
  subtitle: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <RoleLayout role="admin">
      <PageHeader title={title} subtitle={subtitle} badge={badge} actions={<HeaderActions role="admin" />} />
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
        <PreviewNotice />
        {children}
      </div>
    </RoleLayout>
  )
}

function PlatformHealth() {
  const rows = [
    { label: 'Web app & API', value: '99.98% uptime', tone: 'success' as const },
    { label: 'Payments (Paystack)', value: 'Connected · test keys', tone: 'success' as const },
    { label: 'Email delivery', value: 'Setup needed', tone: 'warn' as const },
    { label: 'Video sessions', value: 'Simulated player', tone: 'neutral' as const },
  ]
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
          <span className="text-[11px] font-semibold text-foreground">{row.label}</span>
          <Badge tone={row.tone}>{row.value}</Badge>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------- Overview -------------------------------- */

export function AdminHome() {
  const [data] = useAdminData()
  const pending = data.users.filter((u) => u.status === 'pending')
  const queue = data.reviews.filter((r) => r.status === 'pending')
  const payoutsDue = data.payouts.filter((p) => p.status === 'due')
  const payoutsTotal = payoutsDue.reduce((sum, p) => sum + p.net, 0)
  const openTasks = seedAdminTasks.filter((task) => task.status !== 'resolved').length
  const highTasks = seedAdminTasks.filter((task) => task.priority === 'high' && task.status !== 'resolved').length
  const totalUnits = seedProducts.reduce((sum, product) => sum + product.sold, 0)
  const mostSold = seedProducts.find((product) => product.name === productSalesStats.mostSold)
  const margin = Math.round((productSalesStats.profit / productSalesStats.totalSales) * 100)

  return (
    <ConsolePage
      title="Platform overview"
      subtitle="Growth, approvals, moderation and money at a glance"
      badge={<Badge tone="role">Admin</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Monthly recurring revenue"
          value={naira(platformStats.mrr, true)}
          icon={Wallet}
          trend={{ value: `${platformStats.growth}%` }}
          sub="vs October"
        />
        <StatCard label="Active students" value={platformStats.students.toLocaleString()} icon={Users} sub="+240 this month" trend={{ value: '5.2%' }} />
        <StatCard label="Teachers & specialists" value={platformStats.teachers + platformStats.specialists} icon={GraduationCap} sub={`${pending.length} awaiting approval`} />
        <StatCard label="Open moderation items" value={queue.length} icon={ShieldCheck} sub="Action needed today" />
      </div>

      <Link to="/admin/profile" className="block">
        <Card className="flex flex-wrap items-center justify-between gap-3 border-role/25 bg-role-soft/60 p-4 transition hover:border-role/40">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-role-ink" />
            <div>
              <p className="text-xs font-bold text-foreground">
                {openTasks} complaints waiting · {highTasks} high priority
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Teacher dashboard issues, parent payment approvals, cancellations, child access and special-needs tutor
                requests.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-role px-3.5 py-2 text-[11px] font-bold text-white">
            Open daily queue <ArrowRight size={13} />
          </span>
        </Card>
      </Link>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SectionCard
          title="Revenue and payouts"
          subtitle="Last eight months · thousands of naira"
          icon={TrendingUp}
          action={
            <Link to="/admin/finance" className="inline-flex items-center gap-1 py-2 text-[11px] font-semibold text-role-ink hover:underline">
              Open finance <ArrowRight size={12} />
            </Link>
          }
        >
          <TrendArea
            data={revenueTrend}
            series={[
              { key: 'revenue', label: 'Revenue', color: '#475569' },
              { key: 'payouts', label: 'Teacher payouts', color: '#0ea5e9' },
            ]}
            yDomain={[0, 4000]}
            unit="k"
            height={250}
          />
        </SectionCard>

        <SectionCard title="Community mix" subtitle="Active accounts by role" icon={Users}>
          <Donut
            data={[
              { name: 'Students', value: 62, color: '#334155' },
              { name: 'Parents', value: 24, color: '#64748b' },
              { name: 'Teachers', value: 9, color: '#0ea5e9' },
              { name: 'Specialists', value: 5, color: '#cbd5e1' },
            ]}
            centerValue={platformStats.students.toLocaleString()}
            centerLabel="learners"
            height={190}
          />
          <div className="mt-3 space-y-1.5">
            <PlatformHealth />
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Product sales"
          value={naira(productSalesStats.totalSales, true)}
          icon={ShoppingCart}
          trend={{ value: '12.4%' }}
          sub="All-time sales"
        />
        <StatCard label="Total purchases" value={productSalesStats.totalPurchases.toLocaleString()} icon={Package} sub="Paid product orders" />
        <StatCard label="Total paid" value={naira(productSalesStats.totalPaid, true)} icon={Receipt} sub="Settled to the platform" />
        <StatCard label="Profit" value={naira(productSalesStats.profit, true)} icon={Wallet} sub={`${margin}% margin after costs`} />
      </div>

      <SectionCard
        title="Sales report"
        subtitle="Product sales and profit · last eight months · thousands of naira"
        icon={BarChart3}
        action={
          <Link to="/admin/sales" className="inline-flex items-center gap-1 py-2 text-[11px] font-semibold text-role-ink hover:underline">
            Open sales <ArrowRight size={12} />
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <TrendArea
            data={salesTrend}
            series={[
              { key: 'sales', label: 'Sales', color: '#475569' },
              { key: 'profit', label: 'Profit', color: '#0ea5e9' },
            ]}
            yDomain={[0, 2000]}
            unit="k"
            height={230}
          />
          <div className="rounded-xl border border-border/70 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Most sales</p>
            <p className="mt-1 text-sm font-extrabold text-foreground">{productSalesStats.mostSold}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{productSalesStats.mostSoldUnits} units sold this year</p>
            <ProgressBar
              value={mostSold ? (mostSold.sold / totalUnits) * 100 : 0}
              className="mt-3"
              label="Share of units sold"
            />
            <div className="mt-4 space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Average order</span>
                <span className="font-bold text-foreground">{naira(productSalesStats.averageOrder)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Costs & royalties</span>
                <span className="font-bold text-foreground">{naira(productSalesStats.totalCosts, true)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Profit margin</span>
                <span className="font-bold text-foreground">{margin}%</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Teacher approvals"
          subtitle="Identity, qualifications and safeguarding checks"
          icon={UserCheck}
          action={
            <Link to="/admin/users" className="inline-flex items-center gap-1 py-2 text-[11px] font-semibold text-role-ink hover:underline">
              All users <ArrowRight size={12} />
            </Link>
          }
        >
          {pending.length ? (
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-role-soft text-[11px] font-bold text-role-ink">
                      {u.name.split(' ').slice(-1)[0].slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">{u.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{u.detail} · applied {u.joined}</p>
                    </div>
                  </div>
                  <Badge tone="warn">{roleLabel(u.kind)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState emoji="✅" title="No pending approvals" description="Every teacher and specialist has been reviewed." />
          )}
        </SectionCard>

        <SectionCard
          title="Moderation queue"
          subtitle="Lessons, resources and flagged discussions"
          icon={ShieldCheck}
          action={
            <Link to="/admin/moderation" className="inline-flex items-center gap-1 py-2 text-[11px] font-semibold text-role-ink hover:underline">
              Review all <ArrowRight size={12} />
            </Link>
          }
        >
          {queue.length ? (
            <div className="space-y-2">
              {queue.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-3">
                  <ReviewIcon kind={item.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {item.author} · {item.subject} · {item.submitted}
                    </p>
                  </div>
                  {item.reports ? <Badge tone="danger">{item.reports} reports</Badge> : <Clock size={14} className="text-muted-foreground" />}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState emoji="🌿" title="Queue is clear" description="Nothing is waiting for review." />
          )}
        </SectionCard>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 border-role/25 bg-role-soft/60 p-4">
        <div className="flex items-start gap-2.5">
          <Wallet size={18} className="mt-0.5 shrink-0 text-role-ink" />
          <div>
            <p className="text-xs font-bold text-foreground">{naira(payoutsTotal)} ready for {payoutsDue.length} teachers</p>
            <p className="text-[11px] text-muted-foreground">Payouts are released after the 3rd of each month, once sessions settle.</p>
          </div>
        </div>
        <Link to="/admin/finance" className="inline-flex items-center gap-1.5 rounded-xl bg-role px-3.5 py-2 text-[11px] font-bold text-white transition hover:opacity-90">
          Process payouts <ArrowRight size={13} />
        </Link>
      </Card>
    </ConsolePage>
  )
}

/* --------------------------------- Users ---------------------------------- */

type UserTab = 'all' | 'student' | 'teacher' | 'specialist' | 'parent' | 'pending'

export function AdminUsers() {
  const [data, setData] = useAdminData()
  const toast = useToast()
  const [tab, setTab] = useState<UserTab>('all')
  const [query, setQuery] = useState('')

  const counts = {
    all: data.users.length,
    student: data.users.filter((u) => u.kind === 'student').length,
    teacher: data.users.filter((u) => u.kind === 'teacher').length,
    specialist: data.users.filter((u) => u.kind === 'specialist').length,
    parent: data.users.filter((u) => u.kind === 'parent').length,
    pending: data.users.filter((u) => u.status === 'pending').length,
  }

  const visible = data.users.filter((u) => {
    if (tab === 'pending' && u.status !== 'pending') return false
    if (tab !== 'all' && tab !== 'pending' && u.kind !== tab) return false
    const term = query.trim().toLowerCase()
    if (!term) return true
    return `${u.name} ${u.email} ${u.detail}`.toLowerCase().includes(term)
  })

  function patch(id: string, change: Partial<AdminUser>) {
    setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === id ? { ...u, ...change } : u)) }))
  }

  function approve(user: AdminUser) {
    patch(user.id, { status: 'active', verified: true })
    toast('Approved', { description: `${user.name} can now teach on NeuroBloom.`, tone: 'success' })
  }

  function verify(user: AdminUser) {
    patch(user.id, { verified: true })
    toast('Verification complete', { description: `${user.name} passed the specialist review.`, tone: 'success' })
  }

  function toggleSuspend(user: AdminUser) {
    const suspended = user.status === 'suspended'
    patch(user.id, { status: suspended ? 'active' : 'suspended' })
    toast(suspended ? 'Account restored' : 'Account suspended', {
      description: suspended ? `${user.name} can sign in again.` : `${user.name} is signed out and blocked until restored.`,
      tone: suspended ? 'success' : 'warn',
    })
  }

  function changePlan(user: AdminUser, plan: PlanId) {
    const price = plans.find((p) => p.id === plan)?.price ?? 0
    patch(user.id, { plan, spend: price })
    toast('Subscription updated', { description: `${user.name} is on the ${planName(plan)}.`, tone: 'success' })
  }

  return (
    <ConsolePage
      title="Users & approvals"
      subtitle="Approve teachers, verify specialists and manage accounts"
      badge={<Badge tone="role">{counts.pending} pending</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total accounts" value={data.users.length} icon={Users} sub="In this sample" />
        <StatCard label="Teachers" value={counts.teacher} icon={GraduationCap} sub="Across all subjects" />
        <StatCard label="Specialists" value={counts.specialist} icon={HeartHandshake} sub="ASD & ADHD support" />
        <StatCard label="Awaiting review" value={counts.pending} icon={Clock} sub="Approve or decline" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs<UserTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'student', label: 'Students', count: counts.student },
            { id: 'teacher', label: 'Teachers', count: counts.teacher },
            { id: 'specialist', label: 'Specialists', count: counts.specialist },
            { id: 'parent', label: 'Parents', count: counts.parent },
          ]}
        />
        <div className="relative w-full sm:w-64">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or class"
            aria-label="Search users"
            className="h-9 pl-8 text-xs"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Account</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Details</th>
                <th className="px-4 py-3 font-bold">Subscription</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {visible.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.kind === 'teacher' ? 'purple' : u.kind === 'specialist' ? 'pink' : u.kind === 'parent' ? 'sky' : 'neutral'}>
                      {roleLabel(u.kind)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{u.detail}</p>
                    {u.rating ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                        <Star size={10} className="fill-amber-400 text-amber-400" /> {u.rating}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {u.plan && u.kind === 'student' ? (
                      <Select
                        aria-label={`Plan for ${u.name}`}
                        value={u.plan}
                        onChange={(event) => changePlan(u, event.target.value as PlanId)}
                        className="h-8 w-36 text-[11px]"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    ) : u.plan ? (
                      <span className="text-muted-foreground">{planName(u.plan)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={statusTone(u.status)}>{u.status === 'active' ? 'Active' : u.status === 'pending' ? 'Pending' : 'Suspended'}</Badge>
                      {(u.kind === 'teacher' || u.kind === 'specialist') && u.status !== 'pending' ? (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {u.verified ? <BadgeCheck size={11} className="text-emerald-600" /> : <Clock size={11} />}
                          {u.verified ? 'Verified' : 'Unverified'}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {u.status === 'pending' ? (
                        <Button size="sm" variant="role" onClick={() => approve(u)}>
                          <CheckCircle2 size={12} /> Approve
                        </Button>
                      ) : null}
                      {(u.kind === 'teacher' || u.kind === 'specialist') && u.status === 'active' && !u.verified ? (
                        <Button size="sm" variant="outline" onClick={() => verify(u)}>
                          <BadgeCheck size={12} /> Verify
                        </Button>
                      ) : null}
                      <Button size="sm" variant={u.status === 'suspended' ? 'outline' : 'ghost'} onClick={() => toggleSuspend(u)}>
                        {u.status === 'suspended' ? (
                          <>
                            <RefreshCw size={12} /> Restore
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Suspend
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No accounts match that filter.</p>
        ) : null}
      </Card>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Approving a teacher unlocks class creation and payouts. Suspended accounts keep their data but cannot sign in.
        These actions apply to the sample dataset in this build.
      </p>
    </ConsolePage>
  )
}

/* ------------------------------- Moderation -------------------------------- */

type ModerationTab = 'pending' | 'approved' | 'removed' | 'all'

export function AdminModeration() {
  const [data, setData] = useAdminData()
  const toast = useToast()
  const [tab, setTab] = useState<ModerationTab>('pending')
  const [category, setCategory] = useState('')

  const counts = {
    pending: data.reviews.filter((r) => r.status === 'pending').length,
    approved: data.reviews.filter((r) => r.status === 'approved').length,
    removed: data.reviews.filter((r) => r.status === 'removed' || r.status === 'dismissed').length,
  }

  const visible = data.reviews.filter((r) => {
    if (tab === 'all') return true
    if (tab === 'removed') return r.status === 'removed' || r.status === 'dismissed'
    return r.status === tab
  })

  function setStatus(review: AdminReview, status: AdminReview['status']) {
    setData((prev) => ({ ...prev, reviews: prev.reviews.map((r) => (r.id === review.id ? { ...r, status } : r)) }))
    const copy = {
      approved: { title: 'Published', message: `${review.title} is live for students.`, tone: 'success' as const },
      removed: { title: 'Content removed', message: `${review.title} is hidden and the author has been notified.`, tone: 'warn' as const },
      dismissed: { title: 'Report dismissed', message: 'No policy breach found. The content stays published.', tone: 'success' as const },
      pending: { title: 'Moved back to review', message: review.title, tone: 'warn' as const },
    }[status]
    toast(copy.title, { description: copy.message, tone: copy.tone })
  }

  function addCategory() {
    const next = category.trim()
    if (!next) return
    if (data.categories.some((c) => c.toLowerCase() === next.toLowerCase())) {
      toast('Category already exists', { description: next, tone: 'warn' })
      return
    }
    setData((prev) => ({ ...prev, categories: [...prev.categories, next] }))
    setCategory('')
    toast('Category added', { description: `${next} is available to teachers.`, tone: 'success' })
  }

  function removeCategory(name: string) {
    setData((prev) => ({ ...prev, categories: prev.categories.filter((c) => c !== name) }))
    toast('Category removed', { description: `${name} is hidden from new lessons.`, tone: 'warn' })
  }

  return (
    <ConsolePage
      title="Content moderation"
      subtitle="Approve lessons, review resources and keep discussions safe"
      badge={<Badge tone={counts.pending ? 'warn' : 'success'}>{counts.pending} waiting</Badge>}
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Tabs<ModerationTab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'pending', label: 'Waiting', count: counts.pending },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'removed', label: 'Removed', count: counts.removed },
              { id: 'all', label: 'All', count: data.reviews.length },
            ]}
          />

          {visible.length ? (
            <div className="space-y-3">
              {visible.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <ReviewIcon kind={item.kind} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground">{item.title}</p>
                        {item.reports ? <Badge tone="danger">{item.reports} reports</Badge> : null}
                        {item.status !== 'pending' ? (
                          <Badge tone={item.status === 'approved' ? 'success' : item.status === 'removed' ? 'danger' : 'neutral'}>
                            {item.status}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.author} · {item.subject} · {item.submitted}
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{item.excerpt}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.status === 'pending' ? (
                          <>
                            <Button size="sm" variant="role" onClick={() => setStatus(item, 'approved')}>
                              <CheckCircle2 size={12} /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStatus(item, 'removed')}>
                              <XCircle size={12} /> Remove
                            </Button>
                            {item.kind === 'discussion' ? (
                              <Button size="sm" variant="ghost" onClick={() => setStatus(item, 'dismissed')}>
                                Dismiss report
                              </Button>
                            ) : null}
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(item, 'pending')}>
                            <RefreshCw size={12} /> Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState emoji="🌿" title="Nothing here" description="Switch tabs to see approved or removed items." />
          )}
        </div>

        <div className="space-y-5">
          <SectionCard title="Subject categories" subtitle="Shown in the teacher upload form" icon={BookOpen}>
            <div className="flex flex-wrap gap-1.5">
              {data.categories.map((name) => (
                <span key={name} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
                  {name}
                  <button
                    type="button"
                    onClick={() => removeCategory(name)}
                    aria-label={`Remove ${name} category`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:bg-rose-100 hover:text-rose-600"
                  >
                    <XCircle size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addCategory()
                  }
                }}
                placeholder="New category"
                aria-label="New category name"
                className="h-9 text-xs"
              />
              <Button size="sm" variant="role" onClick={addCategory} disabled={!category.trim()}>
                <Plus size={12} /> Add
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Moderation policy" subtitle="How the queue is triaged" icon={ShieldCheck}>
            <ul className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /> Lessons and resources need approval before students can see them.</li>
              <li className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /> Reports from parents are reviewed within one school day.</li>
              <li className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /> Contact details in class chats are removed automatically.</li>
              <li className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /> Specialists must hold a valid safeguarding certificate.</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </ConsolePage>
  )
}

/* --------------------------------- Finance --------------------------------- */

type FinanceTab = 'subscriptions' | 'payments' | 'payouts'

export function AdminFinance() {
  const [data, setData] = useAdminData()
  const toast = useToast()
  const [tab, setTab] = useState<FinanceTab>('subscriptions')
  const [refund, setRefund] = useState<AdminLedgerRow | null>(null)

  const mrr = data.subscriptions.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0)
  const due = data.payouts.filter((p) => p.status === 'due')
  const dueTotal = due.reduce((sum, p) => sum + p.net, 0)

  function cancelSubscription(row: AdminSubscription) {
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) => (s.id === row.id ? { ...s, status: 'cancelled', next: '—' } : s)),
    }))
    toast('Subscription cancelled', { description: `${row.child} keeps access until the end of the paid month.`, tone: 'warn' })
  }

  function issueRefund() {
    if (!refund) return
    const row = refund
    setData((prev) => ({
      ...prev,
      ledger: prev.ledger.map((l) => (l.id === row.id ? { ...l, status: 'refunded' } : l)),
    }))
    setRefund(null)
    toast('Refund issued', { description: `${naira(row.amount)} is on its way back to ${row.parent}.`, tone: 'success' })
  }

  function processPayout(payout: AdminPayout) {
    setData((prev) => ({ ...prev, payouts: prev.payouts.map((p) => (p.id === payout.id ? { ...p, status: 'paid' } : p)) }))
    toast('Payout sent', { description: `${naira(payout.net)} transferred to ${payout.teacher}.`, tone: 'success' })
  }

  function processAll() {
    setData((prev) => ({ ...prev, payouts: prev.payouts.map((p) => (p.status === 'due' ? { ...p, status: 'paid' } : p)) }))
    toast('Payouts processed', { description: `${naira(dueTotal)} released to ${due.length} teachers.`, tone: 'success' })
  }

  return (
    <ConsolePage
      title="Finance"
      subtitle="Subscriptions, payment analytics, payouts and refunds"
      badge={<Badge tone="success">Paystack connected</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Collected this month" value={naira(platformStats.collected, true)} icon={Receipt} trend={{ value: '8.9%' }} sub="vs October" />
        <StatCard label="Recurring revenue" value={naira(platformStats.mrr, true)} icon={RefreshCw} sub="Active plans" />
        <StatCard label="Refunds" value={naira(platformStats.refunds, true)} icon={Wallet} sub="2 this month" />
        <StatCard label="Payouts due" value={naira(dueTotal, true)} icon={Users} sub={`${due.length} teachers`} />
      </div>

      <Tabs<FinanceTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'subscriptions', label: 'Subscriptions', count: data.subscriptions.length },
          { id: 'payments', label: 'Payments', count: data.ledger.length },
          { id: 'payouts', label: 'Payouts', count: data.payouts.length },
        ]}
      />

      {tab === 'subscriptions' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Child</th>
                  <th className="px-4 py-3 font-bold">Parent</th>
                  <th className="px-4 py-3 font-bold">Plan</th>
                  <th className="px-4 py-3 text-right font-bold">Monthly</th>
                  <th className="px-4 py-3 font-bold">Next billing</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {data.subscriptions.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.child}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.parent}</td>
                    <td className="px-4 py-3 text-muted-foreground">{planName(row.plan)}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{naira(row.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.next}</td>
                    <td className="px-4 py-3">
                      <Badge tone={row.status === 'active' ? 'success' : row.status === 'past_due' ? 'warn' : 'neutral'}>
                        {row.status === 'active' ? 'Active' : row.status === 'past_due' ? 'Past due' : 'Cancelled'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status !== 'cancelled' ? (
                        <Button size="sm" variant="ghost" onClick={() => cancelSubscription(row)}>
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
            Sample recurring revenue from active plans: <span className="font-semibold text-foreground">{naira(mrr)}</span>
          </div>
        </Card>
      ) : null}

      {tab === 'payments' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Parent</th>
                  <th className="px-4 py-3 font-bold">Child</th>
                  <th className="px-4 py-3 font-bold">Plan</th>
                  <th className="px-4 py-3 text-right font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Coupon</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {data.ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{row.parent}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.child}</td>
                    <td className="px-4 py-3 text-muted-foreground">{planName(row.plan)}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{naira(row.amount)}</td>
                    <td className="px-4 py-3">{row.coupon ? <Badge tone="purple">{row.coupon}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">
                      <Badge tone={row.status === 'success' ? 'success' : row.status === 'refunded' ? 'neutral' : 'danger'}>
                        {row.status === 'success' ? 'Paid' : row.status === 'refunded' ? 'Refunded' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === 'success' ? (
                        <Button size="sm" variant="ghost" onClick={() => setRefund(row)}>
                          Refund
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === 'payouts' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {due.length} payouts waiting · platform fee 15%
            </p>
            <Button size="sm" variant="role" onClick={processAll} disabled={!due.length}>
              <Wallet size={13} /> Process all due
            </Button>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Teacher</th>
                    <th className="px-4 py-3 font-bold">Period</th>
                    <th className="px-4 py-3 text-right font-bold">Gross</th>
                    <th className="px-4 py-3 text-right font-bold">Fee</th>
                    <th className="px-4 py-3 text-right font-bold">Net</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 text-xs">
                  {data.payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{payout.teacher}</td>
                      <td className="px-4 py-3 text-muted-foreground">{payout.period}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{naira(payout.gross)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{naira(payout.fee)}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{naira(payout.net)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={payout.status === 'paid' ? 'success' : 'warn'}>{payout.status === 'paid' ? 'Paid' : 'Due'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {payout.status === 'due' ? (
                          <Button size="sm" variant="outline" onClick={() => processPayout(payout)}>
                            Send
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      <Modal
        open={Boolean(refund)}
        onClose={() => setRefund(null)}
        title="Issue a refund"
        subtitle={refund ? `${refund.parent} · ${naira(refund.amount)}` : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRefund(null)}>
              Keep payment
            </Button>
            <Button variant="danger" size="sm" onClick={issueRefund}>
              Refund {refund ? naira(refund.amount) : ''}
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          The full amount returns to the parent’s original payment method through Paystack. The child’s plan stays active
          until the refund settles, then reverts to the free tier.
        </p>
      </Modal>
    </ConsolePage>
  )
}

/* -------------------------------- Analytics -------------------------------- */

export function AdminAnalytics() {
  const [data] = useAdminData()
  const activeSubs = data.subscriptions.filter((s) => s.status === 'active').length

  return (
    <ConsolePage
      title="Analytics"
      subtitle="Growth, engagement, retention and teacher performance"
      badge={<Badge tone="role">Last 8 months</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Students" value={platformStats.students.toLocaleString()} icon={Users} trend={{ value: '5.2%' }} sub="month on month" />
        <StatCard label="90-day retention" value="81%" icon={TrendingUp} trend={{ value: '2.1%' }} sub="vs last cohort" />
        <StatCard label="Avg. session" value="34 min" icon={Clock} sub="Across all learners" />
        <StatCard label="Active subscriptions" value={activeSubs} icon={Receipt} sub="In this sample" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Student growth" subtitle="Total enrolled learners" icon={TrendingUp}>
          <TrendArea
            data={studentGrowth}
            series={[{ key: 'students', label: 'Students', color: '#475569' }]}
            yDomain={[0, 5200]}
            unit=""
            height={230}
          />
        </SectionCard>

        <SectionCard title="New teachers" subtitle="Hired and verified each month" icon={GraduationCap}>
          <GroupedBars
            data={teacherGrowth}
            series={[{ key: 'hired', label: 'Teachers hired', color: '#0ea5e9' }]}
            height={230}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Customer growth" subtitle="Parents and teachers added each month" icon={Users}>
          <GroupedBars
            data={customerGrowth}
            series={[
              { key: 'parents', label: 'Parents', color: '#475569' },
              { key: 'teachers', label: 'Teachers', color: '#0ea5e9' },
            ]}
            height={230}
          />
        </SectionCard>

        <SectionCard title="Product statistics" subtitle="Share of product revenue by type" icon={Package}>
          <Donut
            data={productCategoryShare}
            centerValue={naira(productSalesStats.totalSales, true)}
            centerLabel="product sales"
            height={190}
          />
          <div className="mt-3 space-y-1.5">
            {productCategoryShare.map((row) => (
              <div key={row.name} className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                  {row.name}
                </span>
                <span className="font-bold text-foreground">{row.value}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SectionCard title="Weekly engagement" subtitle="Lessons attended and quizzes completed" icon={BarChart3}>
          <GroupedBars
            data={weeklyActivity}
            series={[
              { key: 'lessons', label: 'Lessons', color: '#475569' },
              { key: 'quizzes', label: 'Quizzes', color: '#0ea5e9' },
            ]}
            height={240}
          />
        </SectionCard>

        <SectionCard title="Engagement signals" subtitle="How often learners return" icon={Users}>
          <div className="space-y-3">
            {[
              { label: 'Daily active learners', value: '1,840', pct: 38 },
              { label: 'Weekly active learners', value: '4,210', pct: 87 },
              { label: 'Complete a lesson weekly', value: '3,960', pct: 82 },
              { label: 'Parents checking in weekly', value: '2,730', pct: 88 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">{row.label}</span>
                  <span className="text-muted-foreground">{row.value}</span>
                </div>
                <ProgressBar value={row.pct} className="mt-1.5" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Retention cohorts" subtitle="Percentage still learning after joining" icon={TrendingUp}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-bold">Cohort</th>
                <th className="px-2 py-2 text-right font-bold">Learners</th>
                <th className="px-2 py-2 text-right font-bold">Day 30</th>
                <th className="px-2 py-2 text-right font-bold">Day 60</th>
                <th className="px-2 py-2 text-right font-bold">Day 90</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {retentionCohorts.map((row) => (
                <tr key={row.cohort}>
                  <td className="px-2 py-3 font-semibold text-foreground">{row.cohort}</td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{row.size.toLocaleString()}</td>
                  <td className="px-2 py-3 text-right">{row.d30 ? `${row.d30}%` : '—'}</td>
                  <td className="px-2 py-3 text-right">{row.d60 ? `${row.d60}%` : '—'}</td>
                  <td className="px-2 py-3 text-right">{row.d90 ? `${row.d90}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Teacher performance" subtitle="Rated by students and parents" icon={Star}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-bold">Teacher</th>
                <th className="px-2 py-2 font-bold">Subject</th>
                <th className="px-2 py-2 text-right font-bold">Rating</th>
                <th className="px-2 py-2 text-right font-bold">Sessions</th>
                <th className="px-2 py-2 text-right font-bold">Response</th>
                <th className="px-2 py-2 text-right font-bold">Completion</th>
                <th className="px-2 py-2 text-right font-bold">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {teacherPerformance.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-3 font-semibold text-foreground">{row.name}</td>
                  <td className="px-2 py-3 text-muted-foreground">{row.subject}</td>
                  <td className="px-2 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> {row.rating}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{row.sessions}</td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{row.response}</td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{row.completion}%</td>
                  <td className="px-2 py-3 text-right font-bold text-foreground">{naira(row.earnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </ConsolePage>
  )
}
