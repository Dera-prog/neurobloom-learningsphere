import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  CalendarX,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  HeartHandshake,
  KeyRound,
  LifeBuoy,
  Mail,
  MailWarning,
  Monitor,
  Package,
  Play,
  Plus,
  Receipt,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { ConsolePage } from './admin'
import { Donut, GroupedBars, TrendArea } from '../components/charts'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  ProgressBar,
  SearchField,
  SectionCard,
  Select,
  StatCard,
  Tabs,
  Toggle,
} from '../components/ui'
import { useToast } from '../components/toast'
import { readComplaints } from '../lib/complaints'
import { naira } from '../lib/utils'
import {
  adminActivity,
  productCategoryShare,
  productSalesStats,
  recentReports,
  reportCatalogue,
  salesChannels,
  salesTrend,
  seedAdminTasks,
  seedFeedback,
  seedInvoices,
  seedOrders,
  seedPayroll,
  seedProducts,
  seedSupportTickets,
  type AdminInvoice,
  type AdminOrder,
  type AdminPayrollRow,
  type AdminProduct,
  type AdminTask,
  type FeedbackStatus,
  type InvoiceStatus,
  type OrderStatus,
  type ProductKind,
  type SupportStatus,
  type TaskArea,
  type TaskStatus,
} from '../data/admin-ops'

/* ------------------------------ Local state ------------------------------- */

function useStored<T>(key: string, seed: () => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : seed()
    } catch {
      return seed()
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Private browsing can block storage; the page still works in memory.
    }
  }, [key, value])
  return [value, setValue] as const
}

const TASKS_KEY = 'neurobloom:admin:tasks:v1'
const PRODUCTS_KEY = 'neurobloom:admin:products:v1'
const INVOICES_KEY = 'neurobloom:admin:invoices:v1'
const PAYROLL_KEY = 'neurobloom:admin:payroll:v1'
const FEEDBACK_KEY = 'neurobloom:admin:feedback:v1'
const SUPPORT_KEY = 'neurobloom:admin:support:v1'
const SETTINGS_KEY = 'neurobloom:admin:settings:v1'

/* -------------------------------- Helpers --------------------------------- */

type Tone = 'neutral' | 'primary' | 'role' | 'success' | 'warn' | 'danger' | 'sky' | 'purple' | 'pink'

const taskAreaMeta: Record<TaskArea, { label: string; icon: typeof Monitor; tone: Tone }> = {
  'teacher-dashboard': { label: 'Teacher dashboard', icon: Monitor, tone: 'danger' },
  'email-delivery': { label: 'Message delivery', icon: MailWarning, tone: 'warn' },
  'subscription-approval': { label: 'Payment approval', icon: CreditCard, tone: 'warn' },
  cancellation: { label: 'Cancellation', icon: CalendarX, tone: 'neutral' },
  'child-access': { label: 'Child access', icon: Eye, tone: 'sky' },
  'special-needs': { label: 'Special-needs tutor', icon: HeartHandshake, tone: 'pink' },
}

const priorityTone: Record<AdminTask['priority'], Tone> = { high: 'danger', medium: 'warn', low: 'neutral' }
const taskStatusTone: Record<TaskStatus, Tone> = { open: 'warn', in_progress: 'sky', resolved: 'success' }
const taskStatusLabel: Record<TaskStatus, string> = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' }

const orderStatusTone: Record<OrderStatus, Tone> = { paid: 'success', pending: 'warn', refunded: 'neutral', failed: 'danger' }
const invoiceStatusTone: Record<InvoiceStatus, Tone> = { paid: 'success', pending: 'warn', overdue: 'danger', draft: 'neutral' }
const feedbackStatusTone: Record<FeedbackStatus, Tone> = { new: 'warn', reviewed: 'sky', actioned: 'success' }
const supportStatusTone: Record<SupportStatus, Tone> = { open: 'warn', waiting: 'sky', resolved: 'success' }
const supportPriorityTone: Record<'urgent' | 'high' | 'normal', Tone> = { urgent: 'danger', high: 'warn', normal: 'neutral' }

const productKindLabel: Record<ProductKind, string> = {
  course: 'Course',
  bundle: 'Bundle',
  'add-on': 'Add-on',
  resource: 'Resource',
  'exam-pack': 'Exam pack',
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}
        />
      ))}
    </span>
  )
}

/* ------------------------------ Admin profile ----------------------------- */

type TaskTab = 'open' | 'in_progress' | 'resolved' | 'all'

export function AdminProfile() {
  const toast = useToast()
  const [overrides, setOverrides] = useStored<Record<string, { status: TaskStatus }>>(TASKS_KEY, () => ({}))
  const [tab, setTab] = useState<TaskTab>('open')

  const tasks = seedAdminTasks.map((task) => ({ ...task, status: overrides[task.id]?.status ?? task.status }))
  const counts = {
    open: tasks.filter((t) => t.status === 'open').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    resolved: tasks.filter((t) => t.status === 'resolved').length,
  }
  const visible = tab === 'all' ? tasks : tasks.filter((task) => task.status === tab)
  const highPriority = tasks.filter((t) => t.priority === 'high' && t.status !== 'resolved').length

  function setTaskStatus(task: AdminTask, status: TaskStatus) {
    setOverrides((prev) => ({ ...prev, [task.id]: { status } }))
    if (status === 'resolved') {
      toast('Complaint resolved', { description: `${task.requester} has been notified about “${task.title}”.`, tone: 'success' })
    } else if (status === 'in_progress') {
      toast('Task started', { description: `You are now handling ${task.requester}’s complaint.`, tone: 'info' })
    } else {
      toast('Complaint reopened', { description: task.title, tone: 'warn' })
    }
  }

  return (
    <ConsolePage
      title="Administrator profile"
      subtitle="Your account, permissions and the complaints queue for today"
      badge={<Badge tone="role">Super Admin</Badge>}
    >
      <Card className="overflow-hidden">
        <div className="bg-[linear-gradient(120deg,#1e293b,#475569)] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold text-white ring-1 ring-white/25">
              ZY
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">Zainab Yusuf</h2>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/85">
                  Admin manager
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/70">admin.demo@example.com · Lagos support desk · WAT</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Approvals', 'Finance', 'Safeguarding', 'Daily complaints'].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/75">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[11px] font-bold text-[#1e293b] transition hover:bg-white/90"
            >
              Manage team <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Today’s queue</p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {counts.open} open · {counts.in_progress} in progress
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{highPriority} high-priority complaints need attention</p>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Access</p>
            <p className="mt-1 text-sm font-bold text-foreground">Full super-admin</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Granted by platform owner · 2FA enabled</p>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Last sign-in</p>
            <p className="mt-1 text-sm font-bold text-foreground">Today, 07:58 AM</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Chrome on Windows · Lagos</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open complaints" value={counts.open} icon={LifeBuoy} sub="Need a first response" />
        <StatCard label="In progress" value={counts.in_progress} icon={Clock} sub="Being worked on" />
        <StatCard label="Resolved" value={counts.resolved} icon={CheckCircle2} sub="This queue" />
        <StatCard label="High priority" value={highPriority} icon={AlertTriangle} sub="Resolve before noon" />
      </div>

      <SectionCard
        title="Daily complaints & tasks"
        subtitle="Teacher issues, parent payment problems and access requests raised today"
        icon={LifeBuoy}
        action={<Badge tone="role">{tasks.length} in queue</Badge>}
      >
        <Tabs<TaskTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'open', label: 'Open', count: counts.open },
            { id: 'in_progress', label: 'In progress', count: counts.in_progress },
            { id: 'resolved', label: 'Resolved', count: counts.resolved },
            { id: 'all', label: 'All', count: tasks.length },
          ]}
        />

        {visible.length ? (
          <div className="mt-4 space-y-3">
            {visible.map((task) => {
              const area = taskAreaMeta[task.area]
              const Icon = area.icon
              return (
                <div key={task.id} className="rounded-xl border border-border/70 p-3.5">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-role-soft text-role-ink">
                      <Icon size={16} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground">{task.title}</p>
                        <Badge tone={priorityTone[task.priority]}>{task.priority} priority</Badge>
                        <Badge tone={area.tone}>{area.label}</Badge>
                        <Badge tone={taskStatusTone[task.status]}>{taskStatusLabel[task.status]}</Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {task.requester} · {task.requesterRole} · opened {task.opened}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{task.detail}</p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                        <Clock size={11} /> Due {task.due}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {task.status === 'open' ? (
                        <Button size="sm" variant="outline" onClick={() => setTaskStatus(task, 'in_progress')}>
                          <Play size={12} /> Start
                        </Button>
                      ) : null}
                      {task.status !== 'resolved' ? (
                        <Button size="sm" variant="role" onClick={() => setTaskStatus(task, 'resolved')}>
                          <CheckCircle2 size={12} /> Resolve
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setTaskStatus(task, 'open')}>
                          <RotateCcw size={12} /> Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            emoji="🌿"
            title={tab === 'resolved' ? 'Nothing resolved yet' : 'Queue is clear'}
            description={
              tab === 'resolved'
                ? 'Complaints you resolve will be archived here with the resolution time.'
                : 'Every complaint in this view has been handled.'
            }
          />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Contact details" subtitle="How the team reaches you" icon={Mail}>
          <dl className="space-y-3 text-xs">
            {[
              { label: 'Work email', value: 'admin.demo@example.com' },
              { label: 'Phone', value: '+234 803 555 0142' },
              { label: 'Office', value: 'Lagos support desk · West Africa Time' },
              { label: 'Emergency cover', value: 'Ade Martins (deputy admin)' },
            ].map((row) => (
              <div key={row.label} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                <dt className="font-semibold text-muted-foreground">{row.label}</dt>
                <dd className="font-semibold text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Access & security" subtitle="Your administrator safeguards" icon={ShieldCheck}>
          <div className="space-y-3 text-xs">
            {[
              { label: 'Two-factor authentication', value: 'Enabled · authenticator app', tone: 'success' as Tone },
              { label: 'Active sessions', value: '3 devices', tone: 'neutral' as Tone },
              { label: 'Role', value: 'Super Admin · full access', tone: 'role' as Tone },
              { label: 'Data export', value: 'Permitted · logged', tone: 'sky' as Tone },
            ].map((row) => (
              <div key={row.label} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                <span className="font-semibold text-muted-foreground">{row.label}</span>
                <Badge tone={row.tone}>{row.value}</Badge>
              </div>
            ))}
            <div className="flex items-center gap-1.5 rounded-xl bg-muted/70 px-3 py-2 text-[11px] text-muted-foreground">
              <KeyRound size={13} /> Permissions cover approvals, refunds, payroll and product publishing.
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent administrator activity" subtitle="Actions recorded against your account" icon={FileText}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-bold">When</th>
                <th className="px-2 py-2 font-bold">Admin</th>
                <th className="px-2 py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {adminActivity.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">{row.time}</td>
                  <td className="whitespace-nowrap px-2 py-3 font-semibold text-foreground">{row.actor}</td>
                  <td className="px-2 py-3 text-muted-foreground">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </ConsolePage>
  )
}

/* ---------------------------------- Sales --------------------------------- */

export function AdminSales() {
  const topProducts = useMemo(() => [...seedProducts].sort((a, b) => b.sold - a.sold), [])
  const totalUnits = topProducts.reduce((sum, p) => sum + p.sold, 0)
  const mostSold = topProducts[0]
  const margin = Math.round((productSalesStats.profit / productSalesStats.totalSales) * 100)

  return (
    <ConsolePage
      title="Sales"
      subtitle="Product sales, purchases, settlements and profit"
      badge={<Badge tone="role">All-time</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total sales" value={naira(productSalesStats.totalSales, true)} icon={ShoppingCart} trend={{ value: '12.4%' }} sub="vs last quarter" />
        <StatCard label="Total purchases" value={productSalesStats.totalPurchases.toLocaleString()} icon={Package} sub="Paid product orders" />
        <StatCard label="Total paid" value={naira(productSalesStats.totalPaid, true)} icon={Receipt} sub="Settled to the platform" />
        <StatCard label="Profit" value={naira(productSalesStats.profit, true)} icon={Wallet} sub={`${margin}% margin after costs`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <SectionCard
          title="Sales report"
          subtitle="Sales and profit · last eight months · thousands of naira"
          icon={TrendingUp}
          action={
            <Link to="/admin/reports" className="inline-flex items-center gap-1 py-2 text-[11px] font-semibold text-role-ink hover:underline">
              Full report <ArrowRight size={12} />
            </Link>
          }
        >
          <TrendArea
            data={salesTrend}
            series={[
              { key: 'sales', label: 'Sales', color: '#475569' },
              { key: 'profit', label: 'Profit', color: '#0ea5e9' },
            ]}
            yDomain={[0, 2000]}
            unit="k"
            height={250}
          />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Most sales" subtitle="Best-selling product this year" icon={Star}>
            <p className="text-sm font-extrabold text-foreground">{productSalesStats.mostSold}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {mostSold.sold} units sold · {naira(mostSold.revenue)}
            </p>
            <ProgressBar value={(mostSold.sold / totalUnits) * 100} className="mt-3" label="Share of units sold" />
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Average order value</span>
              <span className="font-bold text-foreground">{naira(productSalesStats.averageOrder)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Cost of goods & royalties</span>
              <span className="font-bold text-foreground">{naira(productSalesStats.totalCosts)}</span>
            </div>
          </SectionCard>

          <SectionCard title="Payment channels" subtitle="Where product payments come from" icon={CreditCard}>
            <Donut data={salesChannels} height={170} />
            <div className="mt-3 space-y-1.5">
              {salesChannels.map((channel) => (
                <div key={channel.name} className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: channel.color }} />
                    {channel.name}
                  </span>
                  <span className="font-bold text-foreground">{channel.value}%</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Top products" subtitle="Ranked by units sold" icon={Package}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-bold">Product</th>
                <th className="px-2 py-2 font-bold">Type</th>
                <th className="px-2 py-2 text-right font-bold">Units</th>
                <th className="px-2 py-2 text-right font-bold">Revenue</th>
                <th className="px-2 py-2 font-bold">Share</th>
                <th className="px-2 py-2 text-right font-bold">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {topProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-2 py-3">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{product.category}</p>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{productKindLabel[product.kind]}</td>
                  <td className="px-2 py-3 text-right font-semibold text-foreground">{product.sold.toLocaleString()}</td>
                  <td className="px-2 py-3 text-right font-bold text-foreground">{naira(product.revenue)}</td>
                  <td className="px-2 py-3">
                    <ProgressBar value={(product.sold / totalUnits) * 100} label={`${product.name} share`} />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className={product.growth >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                      {product.growth >= 0 ? '↑' : '↓'} {Math.abs(product.growth)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </ConsolePage>
  )
}

/* --------------------------------- Orders --------------------------------- */

type OrderTab = 'all' | OrderStatus

export function AdminOrders() {
  const toast = useToast()
  const [tab, setTab] = useState<OrderTab>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AdminOrder | null>(null)

  const counts = {
    all: seedOrders.length,
    paid: seedOrders.filter((o) => o.status === 'paid').length,
    pending: seedOrders.filter((o) => o.status === 'pending').length,
    refunded: seedOrders.filter((o) => o.status === 'refunded').length,
    failed: seedOrders.filter((o) => o.status === 'failed').length,
  }
  const paidValue = seedOrders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0)
  const pendingValue = seedOrders.filter((o) => o.status === 'pending').reduce((sum, o) => sum + o.amount, 0)
  const refundedValue = seedOrders.filter((o) => o.status === 'refunded').reduce((sum, o) => sum + o.amount, 0)

  const needle = query.trim().toLowerCase()
  const visible = seedOrders.filter((order) => {
    const inTab = tab === 'all' || order.status === tab
    const inQuery =
      !needle ||
      [order.id, order.customer, order.learner, order.item].some((value) => value.toLowerCase().includes(needle))
    return inTab && inQuery
  })

  return (
    <ConsolePage
      title="Orders"
      subtitle="Every product order, payment state and fulfilment record"
      badge={<Badge tone="success">Paystack live</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Orders this month" value={seedOrders.length} icon={ShoppingCart} sub="All product orders" />
        <StatCard label="Paid value" value={naira(paidValue, true)} icon={Receipt} sub={`${counts.paid} settled orders`} />
        <StatCard label="Awaiting payment" value={naira(pendingValue, true)} icon={Clock} sub={`${counts.pending} pending`} />
        <StatCard label="Refunded" value={naira(refundedValue, true)} icon={RotateCcw} sub={`${counts.refunded} refund · ${counts.failed} failed`} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs<OrderTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'paid', label: 'Paid', count: counts.paid },
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'refunded', label: 'Refunded', count: counts.refunded },
            { id: 'failed', label: 'Failed', count: counts.failed },
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Search order, parent or learner" className="sm:w-72" />
      </div>

      {visible.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Item</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 text-right font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Channel</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {visible.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-foreground">{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{order.customer}</p>
                      <p className="text-[10px] text-muted-foreground">for {order.learner}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.item}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{order.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-foreground">{naira(order.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.channel}</td>
                    <td className="px-4 py-3">
                      <Badge tone={orderStatusTone[order.status]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(order)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
            <span>{visible.length} orders shown</span>
            <span>
              Paid total: <span className="font-bold text-foreground">{naira(visible.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0))}</span>
            </span>
          </div>
        </Card>
      ) : (
        <EmptyState emoji="🧾" title="No orders match" description="Try a different status or search term." />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.id}` : 'Order'}
        subtitle={selected ? `${selected.customer} · ${selected.date}` : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selected) return
                toast('Receipt sent', { description: `${selected.customer} will receive ${selected.id} by email.`, tone: 'success' })
              }}
            >
              <Send size={13} /> Email receipt
            </Button>
          </div>
        }
      >
        {selected ? (
          <dl className="space-y-3 text-xs">
            {[
              { label: 'Learner', value: selected.learner },
              { label: 'Product', value: selected.item },
              { label: 'Amount', value: naira(selected.amount) },
              { label: 'Channel', value: selected.channel },
              { label: 'Status', value: selected.status },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5 last:border-0">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-semibold capitalize text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Modal>
    </ConsolePage>
  )
}

/* -------------------------------- Products -------------------------------- */

export function AdminProducts() {
  const toast = useToast()
  const [products, setProducts] = useStored<AdminProduct[]>(PRODUCTS_KEY, () => seedProducts.map((p) => ({ ...p })))
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', kind: 'resource' as ProductKind, category: 'Mathematics', price: '' })

  const needle = query.trim().toLowerCase()
  const visible = products.filter((product) =>
    !needle ? true : [product.name, product.category, productKindLabel[product.kind]].some((value) => value.toLowerCase().includes(needle)),
  )
  const live = products.filter((p) => p.status === 'live')
  const units = products.reduce((sum, p) => sum + p.sold, 0)
  const revenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const avgRating = products.reduce((sum, p) => sum + p.rating, 0) / products.length

  function toggleStatus(product: AdminProduct) {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: p.status === 'live' ? 'draft' : 'live' } : p)),
    )
    toast(product.status === 'live' ? 'Product unpublished' : 'Product published', {
      description: `${product.name} is now ${product.status === 'live' ? 'hidden from the store' : 'live in the store'}.`,
      tone: product.status === 'live' ? 'warn' : 'success',
    })
  }

  function addProduct() {
    const price = Number(draft.price)
    if (!draft.name.trim() || !Number.isFinite(price) || price <= 0) {
      toast('Add a product name and price', { description: 'Both are needed before the product can be created.', tone: 'warn' })
      return
    }
    const product: AdminProduct = {
      id: `pr${Date.now()}`,
      name: draft.name.trim(),
      kind: draft.kind,
      category: draft.category,
      price,
      sold: 0,
      revenue: 0,
      rating: 0,
      growth: 0,
      status: 'draft',
    }
    setProducts((prev) => [product, ...prev])
    setAdding(false)
    setDraft({ name: '', kind: 'resource', category: 'Mathematics', price: '' })
    toast('Product created as a draft', { description: 'Publish it from the products table when it is ready.', tone: 'success' })
  }

  return (
    <ConsolePage
      title="Products"
      subtitle="Catalogue, pricing, sales performance and product statistics"
      badge={<Badge tone="role">Catalogue</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Live products" value={`${live.length}/${products.length}`} icon={Package} sub="Visible in the store" />
        <StatCard label="Units sold" value={units.toLocaleString()} icon={ShoppingCart} sub="All products" />
        <StatCard label="Product revenue" value={naira(revenue, true)} icon={Receipt} sub="Before refunds" />
        <StatCard label="Average rating" value={avgRating.toFixed(1)} icon={Star} sub="Across the catalogue" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search products or categories" className="sm:w-72" />
        <Button size="sm" variant="role" onClick={() => setAdding(true)}>
          <Plus size={13} /> New product
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 text-right font-bold">Price</th>
                <th className="px-4 py-3 text-right font-bold">Units</th>
                <th className="px-4 py-3 text-right font-bold">Revenue</th>
                <th className="px-4 py-3 text-right font-bold">Rating</th>
                <th className="px-4 py-3 text-right font-bold">Growth</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {visible.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{product.category}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{productKindLabel[product.kind]}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">{naira(product.price)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{product.sold.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{naira(product.revenue)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    {product.rating ? `★ ${product.rating}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={product.growth >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                      {product.growth >= 0 ? '↑' : '↓'} {Math.abs(product.growth)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={product.status === 'live' ? 'success' : 'neutral'}>
                      {product.status === 'live' ? 'Live' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(product)}>
                      {product.status === 'live' ? 'Unpublish' : 'Publish'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length ? (
          <div className="p-4">
            <EmptyState emoji="📦" title="No products match" description="Try a different search term." />
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Product statistics" subtitle="Share of product revenue by type" icon={BarChart3}>
          <Donut data={productCategoryShare} centerValue={naira(productSalesStats.totalSales, true)} centerLabel="product sales" height={190} />
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

        <SectionCard title="Best sellers" subtitle="Units sold out of 1,284 purchases" icon={TrendingUp}>
          <div className="space-y-3">
            {[...products]
              .sort((a, b) => b.sold - a.sold)
              .slice(0, 5)
              .map((product) => (
                <div key={product.id}>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate font-semibold text-foreground">{product.name}</span>
                    <span className="shrink-0 text-muted-foreground">{product.sold} units</span>
                  </div>
                  <ProgressBar value={(product.sold / units) * 100} className="mt-1.5" label={`${product.name} units`} />
                </div>
              ))}
          </div>
        </SectionCard>
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New product"
        subtitle="Draft products are private until you publish them"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={addProduct}>
              <Plus size={13} /> Create draft
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Product name"
            placeholder="e.g. JSS3 Basic Science Revision Pack"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={draft.kind}
              onChange={(e) => setDraft((prev) => ({ ...prev, kind: e.target.value as ProductKind }))}
            >
              {Object.entries(productKindLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Price (₦)"
              type="number"
              min="0"
              placeholder="6500"
              value={draft.price}
              onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <Select
            label="Category"
            value={draft.category}
            onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
          >
            {['Mathematics', 'English', 'Basic Science', 'Physics', 'Chemistry', 'Biology', 'Coding', 'Special needs', 'Art & Music'].map(
              (category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ),
            )}
          </Select>
        </div>
      </Modal>
    </ConsolePage>
  )
}

/* --------------------------------- Invoices ------------------------------- */

export function AdminInvoices() {
  const toast = useToast()
  const [overrides, setOverrides] = useStored<Record<string, InvoiceStatus>>(INVOICES_KEY, () => ({}))
  const [tab, setTab] = useState<AdminInvoice['kind']>('parent')

  const invoices = seedInvoices.map((invoice) => ({ ...invoice, status: overrides[invoice.id] ?? invoice.status }))
  const outstanding = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0)
  const paid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const overdue = invoices.filter((i) => i.status === 'overdue').length
  const visible = invoices.filter((invoice) => invoice.kind === tab)

  function markPaid(invoice: AdminInvoice) {
    setOverrides((prev) => ({ ...prev, [invoice.id]: 'paid' }))
    toast('Invoice marked paid', { description: `${invoice.id} · ${naira(invoice.amount)} recorded for ${invoice.party}.`, tone: 'success' })
  }

  return (
    <ConsolePage
      title="Invoices"
      subtitle="Parent subscriptions and teacher/tutor commission invoices"
      badge={<Badge tone="role">Finance</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Outstanding" value={naira(outstanding, true)} icon={FileText} sub={`${invoices.filter((i) => i.status === 'pending').length} pending invoices`} />
        <StatCard label="Paid" value={naira(paid, true)} icon={CheckCircle2} sub={`${invoices.filter((i) => i.status === 'paid').length} settled`} />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} sub="Needs a reminder" />
        <StatCard label="Invoices issued" value={invoices.length} icon={Receipt} sub="October–November" />
      </div>

      <Tabs<AdminInvoice['kind']>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'parent', label: 'Parents & guardians', count: invoices.filter((i) => i.kind === 'parent').length },
          { id: 'teacher', label: 'Teachers & tutors', count: invoices.filter((i) => i.kind === 'teacher').length },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Invoice</th>
                <th className="px-4 py-3 font-bold">{tab === 'parent' ? 'Parent / guardian' : 'Teacher / tutor'}</th>
                <th className="px-4 py-3 font-bold">Description</th>
                <th className="px-4 py-3 font-bold">Period</th>
                <th className="px-4 py-3 text-right font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Due</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {visible.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-foreground">{invoice.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{invoice.party}</p>
                    <p className="text-[10px] text-muted-foreground">{invoice.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{invoice.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{invoice.period}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-foreground">{naira(invoice.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{invoice.due}</td>
                  <td className="px-4 py-3">
                    <Badge tone={invoiceStatusTone[invoice.status]}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invoice.status === 'paid' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast('Invoice downloaded', { description: `${invoice.id} PDF prepared.`, tone: 'info' })}
                      >
                        <Download size={12} /> PDF
                      </Button>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toast('Reminder sent', {
                              description: `${invoice.party} will get a payment reminder for ${invoice.id}.`,
                              tone: 'info',
                            })
                          }
                        >
                          <Send size={12} /> Remind
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => markPaid(invoice)}>
                          Mark paid
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
          <span>{visible.length} invoices · {tab === 'parent' ? 'parent subscriptions' : 'teacher commissions'}</span>
          <span>
            Total: <span className="font-bold text-foreground">{naira(visible.reduce((sum, i) => sum + i.amount, 0))}</span>
          </span>
        </div>
      </Card>
    </ConsolePage>
  )
}

/* --------------------------------- Payroll -------------------------------- */

export function AdminPayroll() {
  const toast = useToast()
  const [overrides, setOverrides] = useStored<Record<string, AdminPayrollRow['status']>>(PAYROLL_KEY, () => ({}))
  const [period, setPeriod] = useState('October 2026')

  const rows = seedPayroll
    .map((row) => ({ ...row, status: overrides[row.id] ?? row.status }))
    .filter((row) => period === 'All periods' || row.period === period)
  const due = rows.filter((row) => row.status === 'due')
  const dueTotal = due.reduce((sum, row) => sum + row.net, 0)
  const paidTotal = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.net, 0)
  const feeTotal = rows.reduce((sum, row) => sum + row.fee, 0)

  function pay(row: AdminPayrollRow) {
    setOverrides((prev) => ({ ...prev, [row.id]: 'paid' }))
    toast('Payout sent', { description: `${naira(row.net)} transferred to ${row.teacher}.`, tone: 'success' })
  }

  function payAll() {
    if (!due.length) return
    setOverrides((prev) => {
      const next = { ...prev }
      due.forEach((row) => {
        next[row.id] = 'paid'
      })
      return next
    })
    toast('Payroll processed', { description: `${naira(dueTotal)} released to ${due.length} teachers and specialists.`, tone: 'success' })
  }

  return (
    <ConsolePage
      title="Teacher payroll"
      subtitle="Session-based pay for teachers, tutors and specialists"
      badge={<Badge tone="warn">Payout day · 5th</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Payroll due" value={naira(dueTotal, true)} icon={Banknote} sub={`${due.length} people waiting`} />
        <StatCard label="Paid" value={naira(paidTotal, true)} icon={CheckCircle2} sub="In the selected period" />
        <StatCard label="People on payroll" value={rows.length} icon={Users} sub="Teachers & specialists" />
        <StatCard label="Platform fees" value={naira(feeTotal, true)} icon={CircleDollarSign} sub="15% commission" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select label="Payroll period" value={period} onChange={(e) => setPeriod(e.target.value)} className="sm:w-52">
          <option>October 2026</option>
          <option>September 2026</option>
          <option>All periods</option>
        </Select>
        <Button size="sm" variant="role" onClick={payAll} disabled={!due.length}>
          <Wallet size={13} /> Process all due
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Teacher / tutor</th>
                <th className="px-4 py-3 font-bold">Subject</th>
                <th className="px-4 py-3 text-right font-bold">Sessions</th>
                <th className="px-4 py-3 text-right font-bold">Hours</th>
                <th className="px-4 py-3 text-right font-bold">Gross</th>
                <th className="px-4 py-3 text-right font-bold">Fee</th>
                <th className="px-4 py-3 text-right font-bold">Net pay</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{row.teacher}</p>
                    <p className="text-[10px] text-muted-foreground">{row.role}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.subject}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.sessions}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.hours}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{naira(row.gross)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{naira(row.fee)}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{naira(row.net)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.status === 'paid' ? 'success' : row.status === 'on_hold' ? 'danger' : 'warn'}>
                      {row.status === 'paid' ? 'Paid' : row.status === 'on_hold' ? 'On hold' : 'Due'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === 'due' ? (
                      <Button size="sm" variant="outline" onClick={() => pay(row)}>
                        Send
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{row.status === 'paid' ? 'Settled' : 'Review'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
          <span>{period} · {rows.length} people · 15% platform fee withheld</span>
          <span>
            Net payroll: <span className="font-bold text-foreground">{naira(rows.reduce((sum, row) => sum + row.net, 0))}</span>
          </span>
        </div>
      </Card>

      <Card className="flex flex-wrap items-start gap-3 border-role/25 bg-role-soft/60 p-4">
        <Wallet size={18} className="mt-0.5 shrink-0 text-role-ink" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground">Payouts run on the 5th, after sessions settle</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Gross earnings come from completed sessions. The 15% platform fee covers hosting, payment processing and
            safeguarding checks. Held payments are reviewed by finance before release.
          </p>
        </div>
      </Card>
    </ConsolePage>
  )
}

/* --------------------------------- Reports -------------------------------- */

export function AdminReports() {
  const toast = useToast()

  return (
    <ConsolePage
      title="Reports"
      subtitle="Scheduled exports across sales, finance, growth, product and support"
      badge={<Badge tone="role">6 reports</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Report templates" value={reportCatalogue.length} icon={FileText} sub="Ready to generate" />
        <StatCard label="Scheduled" value={4} icon={Clock} sub="Weekly and monthly" />
        <StatCard label="Last run" value="2 Nov" icon={CheckCircle2} sub="Support complaints log" />
        <StatCard label="Formats" value="PDF · CSV" icon={Download} sub="XLSX for finance" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportCatalogue.map((report) => (
          <Card key={report.id} className="flex h-full flex-col p-4" hover>
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-role-soft text-role-ink">
                <FileText size={16} aria-hidden />
              </span>
              <div className="flex gap-1">
                <Badge tone="neutral">{report.cadence}</Badge>
                <Badge tone="role">{report.format}</Badge>
              </div>
            </div>
            <h3 className="mt-3 text-sm font-bold text-foreground">{report.title}</h3>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">{report.description}</p>
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
              <span>{report.owner} · last {report.lastRun}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast(`${report.title} is generating`, {
                    description: `A ${report.format} export will appear in recent downloads.`,
                    tone: 'info',
                  })
                }
              >
                Generate
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <SectionCard title="Recent downloads" subtitle="Exports produced by the admin team" icon={Download}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-bold">Report</th>
                <th className="px-2 py-2 font-bold">Generated by</th>
                <th className="px-2 py-2 font-bold">Date</th>
                <th className="px-2 py-2 text-right font-bold">Size</th>
                <th className="px-2 py-2 text-right font-bold">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-xs">
              {recentReports.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-3 font-semibold text-foreground">{row.name}</td>
                  <td className="px-2 py-3 text-muted-foreground">{row.by}</td>
                  <td className="px-2 py-3 text-muted-foreground">{row.date}</td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{row.size}</td>
                  <td className="px-2 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast('Download started', { description: row.name, tone: 'info' })}
                    >
                      <Download size={12} /> Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </ConsolePage>
  )
}

/* -------------------------------- Feedback -------------------------------- */

type FeedbackTab = 'all' | FeedbackStatus

export function AdminFeedback() {
  const toast = useToast()
  const [overrides, setOverrides] = useStored<Record<string, FeedbackStatus>>(FEEDBACK_KEY, () => ({}))
  const [tab, setTab] = useState<FeedbackTab>('all')
  const [query, setQuery] = useState('')

  const items = seedFeedback.map((item) => ({ ...item, status: overrides[item.id] ?? item.status }))
  const average = items.reduce((sum, item) => sum + item.rating, 0) / items.length
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: items.filter((item) => item.rating === rating).length,
  }))
  const needle = query.trim().toLowerCase()
  const visible = items.filter((item) => {
    const inTab = tab === 'all' || item.status === tab
    const inQuery =
      !needle ||
      [item.author, item.category, item.message, item.role].some((value) => value.toLowerCase().includes(needle))
    return inTab && inQuery
  })

  function setStatus(item: (typeof items)[number], status: FeedbackStatus) {
    setOverrides((prev) => ({ ...prev, [item.id]: status }))
    toast(status === 'actioned' ? 'Feedback actioned' : 'Marked as reviewed', {
      description: `${item.author}’s feedback is now ${status}.`,
      tone: 'success',
    })
  }

  return (
    <ConsolePage
      title="Feedback"
      subtitle="What parents, teachers and learners say about the platform"
      badge={<Badge tone="role">{items.length} responses</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Average rating" value={average.toFixed(1)} icon={Star} sub={`${items.length} responses`} />
        <StatCard label="New feedback" value={items.filter((item) => item.status === 'new').length} icon={Mail} sub="Awaiting review" />
        <StatCard label="Actioned" value={items.filter((item) => item.status === 'actioned').length} icon={CheckCircle2} sub="Changes shipped" />
        <StatCard label="Response rate" value="87%" icon={TrendingUp} trend={{ value: '6%' }} sub="vs last month" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SectionCard title="Rating breakdown" subtitle="All-time responses" icon={Star}>
          <div className="mb-3 flex items-end gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">{average.toFixed(1)}</span>
            <div className="pb-1">
              <Stars rating={average} size={13} />
              <p className="mt-0.5 text-[10px] text-muted-foreground">Out of 5</p>
            </div>
          </div>
          <div className="space-y-2">
            {distribution.map((row) => (
              <div key={row.rating} className="flex items-center gap-2">
                <span className="w-3 text-[10px] font-semibold text-muted-foreground">{row.rating}</span>
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <ProgressBar value={(row.count / items.length) * 100} className="flex-1" label={`${row.rating} star responses`} />
                <span className="w-4 text-right text-[10px] text-muted-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Responses" subtitle="Filter and triage platform feedback" icon={LifeBuoy}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Tabs<FeedbackTab>
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'all', label: 'All', count: items.length },
                  { id: 'new', label: 'New', count: items.filter((item) => item.status === 'new').length },
                  { id: 'reviewed', label: 'Reviewed', count: items.filter((item) => item.status === 'reviewed').length },
                  { id: 'actioned', label: 'Actioned', count: items.filter((item) => item.status === 'actioned').length },
                ]}
              />
              <SearchField value={query} onChange={setQuery} placeholder="Search feedback" className="sm:w-52" />
            </div>

            {visible.length ? (
              <div className="space-y-2.5">
                {visible.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">{item.author}</p>
                      <Badge tone="neutral">{item.role}</Badge>
                      <Badge tone={feedbackStatusTone[item.status]}>{item.status}</Badge>
                      <span className="ml-auto text-[10px] text-muted-foreground">{item.date}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars rating={item.rating} size={10} />
                      <span className="text-[10px] font-semibold text-muted-foreground">{item.category}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{item.message}</p>
                    {item.status !== 'actioned' ? (
                      <div className="mt-2 flex justify-end gap-1.5">
                        {item.status === 'new' ? (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(item, 'reviewed')}>
                            Mark reviewed
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => setStatus(item, 'actioned')}>
                          <CheckCircle2 size={12} /> Actioned
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState emoji="💬" title="No feedback matches" description="Try another filter or search term." />
            )}
          </div>
        </SectionCard>
      </div>
    </ConsolePage>
  )
}

/* --------------------------------- Support -------------------------------- */

type SupportTab = 'all' | SupportStatus

export function AdminSupport() {
  const toast = useToast()
  const [overrides, setOverrides] = useStored<Record<string, SupportStatus>>(SUPPORT_KEY, () => ({}))
  const [tab, setTab] = useState<SupportTab>('all')
  const [query, setQuery] = useState('')
  // Complaints teachers send from their sidebar land at the top of this queue.
  const [complaints] = useState(() => readComplaints())

  const tickets = [...complaints, ...seedSupportTickets].map((ticket) => ({
    ...ticket,
    status: overrides[ticket.id] ?? ticket.status,
  }))
  const needle = query.trim().toLowerCase()
  const visible = tickets.filter((ticket) => {
    const inTab = tab === 'all' || ticket.status === tab
    const inQuery =
      !needle ||
      [ticket.id, ticket.subject, ticket.requester, ticket.role, ticket.excerpt].some((value) =>
        value.toLowerCase().includes(needle),
      )
    return inTab && inQuery
  })

  function setStatus(ticket: (typeof tickets)[number], status: SupportStatus) {
    setOverrides((prev) => ({ ...prev, [ticket.id]: status }))
    const copy = {
      open: { title: 'Ticket reopened', desc: `${ticket.requester} has been notified.` },
      waiting: { title: 'Reply sent', desc: `We asked ${ticket.requester} for more detail on ${ticket.id}.` },
      resolved: { title: 'Ticket resolved', desc: `${ticket.id} is closed and the requester has the outcome.` },
    }[status]
    toast(copy.title, { description: copy.desc, tone: status === 'resolved' ? 'success' : 'info' })
  }

  return (
    <ConsolePage
      title="Help & support"
      subtitle="Complaint tickets, response times and escalations"
      badge={<Badge tone="warn">{tickets.filter((ticket) => ticket.status !== 'resolved').length} active</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open tickets" value={tickets.filter((ticket) => ticket.status === 'open').length} icon={LifeBuoy} sub="Need a reply" />
        <StatCard label="Urgent" value={tickets.filter((ticket) => ticket.priority === 'urgent').length} icon={AlertTriangle} sub="SLA 30 minutes" />
        <StatCard label="Waiting on user" value={tickets.filter((ticket) => ticket.status === 'waiting').length} icon={Clock} sub="Awaiting information" />
        <StatCard label="Resolved" value={tickets.filter((ticket) => ticket.status === 'resolved').length} icon={CheckCircle2} sub="This week" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs<SupportTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'All', count: tickets.length },
            { id: 'open', label: 'Open', count: tickets.filter((ticket) => ticket.status === 'open').length },
            { id: 'waiting', label: 'Waiting', count: tickets.filter((ticket) => ticket.status === 'waiting').length },
            { id: 'resolved', label: 'Resolved', count: tickets.filter((ticket) => ticket.status === 'resolved').length },
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Search tickets" className="sm:w-64" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <div className="space-y-2.5">
          {visible.length ? (
            visible.map((ticket) => (
              <Card key={ticket.id} className="p-3.5">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-role-soft text-role-ink">
                    <LifeBuoy size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">{ticket.subject}</p>
                      <Badge tone={supportPriorityTone[ticket.priority]}>{ticket.priority}</Badge>
                      <Badge tone={supportStatusTone[ticket.status]}>{ticket.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {ticket.id} · {ticket.requester} ({ticket.role}) · opened {ticket.opened} · updated {ticket.updated}
                      {'category' in ticket && ticket.category ? ` · ${ticket.category}` : ''}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{ticket.excerpt}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {ticket.status === 'open' ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus(ticket, 'waiting')}>
                        <Mail size={12} /> Reply
                      </Button>
                    ) : null}
                    {ticket.status !== 'resolved' ? (
                      <Button size="sm" variant="role" onClick={() => setStatus(ticket, 'resolved')}>
                        <CheckCircle2 size={12} /> Resolve
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(ticket, 'open')}>
                        <RotateCcw size={12} /> Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState emoji="🎧" title="No tickets match" description="Try a different status or search term." />
          )}
        </div>

        <div className="space-y-5">
          <SectionCard title="Response health" subtitle="Against the 30-minute first-reply target" icon={Clock}>
            <div className="space-y-3">
              {[
                { label: 'Median first response', value: '11 min', pct: 88 },
                { label: 'Within SLA', value: '92%', pct: 92 },
                { label: 'Resolved same day', value: '74%', pct: 74 },
                { label: 'Reopened tickets', value: '6%', pct: 6 },
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

          <Card className="flex items-start gap-2.5 border-role/25 bg-role-soft/60 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-role-ink" />
            <div>
              <p className="text-xs font-bold text-foreground">Safeguarding escalations</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Any ticket mentioning a child’s safety must go to the safeguarding lead within 15 minutes, alongside the
                support reply.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </ConsolePage>
  )
}

/* --------------------------------- Settings ------------------------------- */

interface AdminSettingsState {
  orgName: string
  supportEmail: string
  invoicePrefix: string
  payoutDay: string
  platformFee: string
  notifyOrders: boolean
  notifyComplaints: boolean
  notifyPayouts: boolean
  notifyWeekly: boolean
  twoFactor: boolean
  restrictExports: boolean
  maintenance: boolean
}

const defaultSettings: AdminSettingsState = {
  orgName: 'NeuroBloom LearningSphere',
  supportEmail: 'support@neurobloom.ng',
  invoicePrefix: 'NB',
  payoutDay: '5th of the month',
  platformFee: '15',
  notifyOrders: true,
  notifyComplaints: true,
  notifyPayouts: true,
  notifyWeekly: false,
  twoFactor: true,
  restrictExports: false,
  maintenance: false,
}

const DEMO_KEYS = [TASKS_KEY, PRODUCTS_KEY, INVOICES_KEY, PAYROLL_KEY, FEEDBACK_KEY, SUPPORT_KEY, SETTINGS_KEY, 'neurobloom:admin:v1']

export function AdminSettings() {
  const toast = useToast()
  const [settings, setSettings] = useStored<AdminSettingsState>(SETTINGS_KEY, () => ({ ...defaultSettings }))
  const [confirmReset, setConfirmReset] = useState(false)

  function update<K extends keyof AdminSettingsState>(key: K, value: AdminSettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    toast('Settings saved', { description: 'Admin manager preferences are up to date.', tone: 'success' })
  }

  function resetDemoData() {
    DEMO_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch {
        // Storage can be blocked in private browsing.
      }
    })
    setConfirmReset(false)
    toast('Demo data reset', { description: 'Tasks, products, invoices and payroll are back to their seed state.', tone: 'info' })
    window.setTimeout(() => window.location.reload(), 600)
  }

  return (
    <ConsolePage
      title="Settings"
      subtitle="Organisation details, notifications, payroll rules and access"
      badge={<Badge tone="role">Admin manager</Badge>}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Organisation profile" subtitle="Shown on invoices, emails and receipts" icon={Settings}>
          <div className="space-y-3">
            <Input label="Organisation name" value={settings.orgName} onChange={(e) => update('orgName', e.target.value)} />
            <Input label="Support email" type="email" value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Invoice prefix" value={settings.invoicePrefix} onChange={(e) => update('invoicePrefix', e.target.value.toUpperCase())} />
              <Input
                label="Platform fee (%)"
                type="number"
                min="0"
                max="40"
                value={settings.platformFee}
                onChange={(e) => update('platformFee', e.target.value)}
              />
            </div>
            <Select label="Payout day" value={settings.payoutDay} onChange={(e) => update('payoutDay', e.target.value)}>
              <option>3rd of the month</option>
              <option>5th of the month</option>
              <option>7th of the month</option>
              <option>Last working day</option>
            </Select>
          </div>
        </SectionCard>

        <SectionCard title="Notifications" subtitle="What the admin manager is alerted about" icon={Mail}>
          <div className="divide-y divide-border/60">
            <Toggle
              checked={settings.notifyOrders}
              onChange={() => update('notifyOrders', !settings.notifyOrders)}
              label="New product orders"
              description="Alert when a product is purchased or a payment fails."
            />
            <Toggle
              checked={settings.notifyComplaints}
              onChange={() => update('notifyComplaints', !settings.notifyComplaints)}
              label="New complaints"
              description="Alert when a teacher, tutor or parent raises a dashboard or billing issue."
            />
            <Toggle
              checked={settings.notifyPayouts}
              onChange={() => update('notifyPayouts', !settings.notifyPayouts)}
              label="Payroll reminders"
              description="Remind the finance team before the monthly teacher payout run."
            />
            <Toggle
              checked={settings.notifyWeekly}
              onChange={() => update('notifyWeekly', !settings.notifyWeekly)}
              label="Weekly digest"
              description="Send sales, growth and support totals every Monday morning."
            />
          </div>
        </SectionCard>

        <SectionCard title="Access & security" subtitle="Protect administrator actions" icon={ShieldCheck}>
          <div className="divide-y divide-border/60">
            <Toggle
              checked={settings.twoFactor}
              onChange={() => update('twoFactor', !settings.twoFactor)}
              label="Require two-factor authentication"
              description="Admin and super-admin accounts must use an authenticator app."
            />
            <Toggle
              checked={settings.restrictExports}
              onChange={() => update('restrictExports', !settings.restrictExports)}
              label="Restrict personal data exports"
              description="Only super admins can download parent, teacher and learner records."
            />
            <Toggle
              checked={settings.maintenance}
              onChange={() => update('maintenance', !settings.maintenance)}
              label="Maintenance mode"
              description="Show a maintenance notice to parents while finance or dashboards are under repair."
            />
          </div>
          <div className="mt-3 rounded-xl bg-muted/70 p-3 text-[11px] text-muted-foreground">
            Admin access is granted by invitation only. Ask the platform owner to add or remove an administrator.
          </div>
        </SectionCard>

        <SectionCard title="Team access" subtitle="People who can act in this console" icon={Users}>
          <div className="space-y-2.5">
            {[
              { name: 'Zainab Yusuf', role: 'Super Admin', email: 'admin.demo@example.com', active: true },
              { name: 'Ade Martins', role: 'Admin · Finance', email: 'ade.martins@neurobloom.ng', active: true },
              { name: 'Grace Okafor', role: 'Support admin', email: 'grace.okafor@neurobloom.ng', active: true },
              { name: 'Kunle Adebayo', role: 'Admin · Product', email: 'kunle.adebayo@neurobloom.ng', active: false },
            ].map((person) => (
              <div key={person.email} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">{person.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{person.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge tone={person.role === 'Super Admin' ? 'role' : 'neutral'}>{person.role}</Badge>
                  <Badge tone={person.active ? 'success' : 'warn'}>{person.active ? 'Active' : 'Invited'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-bold text-foreground">Save your admin preferences</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Changes apply to this browser immediately.</p>
        </div>
        <Button variant="role" onClick={save}>
          <CheckCircle2 size={14} /> Save settings
        </Button>
      </Card>

      <Card className="border-destructive/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
            <div>
              <p className="text-xs font-bold text-foreground">Reset demo data</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Restore tasks, products, invoices, payroll, feedback and support tickets to their seed state. This cannot
                be undone.
              </p>
            </div>
          </div>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Reset demo data
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        subtitle="This clears every local change made in the admin manager"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
              Keep my changes
            </Button>
            <Button variant="danger" size="sm" onClick={resetDemoData}>
              Reset everything
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          Tasks, product publishing, invoice statuses, payroll runs, feedback triage and support replies will return to
          the sample data that ships with the console. Your account and theme preference are not affected.
        </p>
      </Modal>
    </ConsolePage>
  )
}
