/* ------------------------------ Daily tasks ------------------------------- */

export type TaskArea =
  | 'teacher-dashboard'
  | 'email-delivery'
  | 'subscription-approval'
  | 'cancellation'
  | 'child-access'
  | 'special-needs'

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'open' | 'in_progress' | 'resolved'

export interface AdminTask {
  id: string
  area: TaskArea
  title: string
  requester: string
  requesterRole: 'Teacher' | 'Tutor' | 'Parent'
  detail: string
  opened: string
  due: string
  priority: TaskPriority
  status: TaskStatus
}

export const seedAdminTasks: AdminTask[] = [
  {
    id: 't1',
    area: 'teacher-dashboard',
    title: 'Live class dashboard is not responding',
    requester: 'Mr. Ifeanyi Okonkwo',
    requesterRole: 'Teacher',
    detail:
      'SSS1 Physics dashboard has spun on the loading screen since 08:40. 24 learners are waiting for the 09:00 lesson. He has refreshed, signed out and tried Chrome and Safari.',
    opened: 'Today, 8:41 AM',
    due: 'Today, 11:00 AM',
    priority: 'high',
    status: 'open',
  },
  {
    id: 't2',
    area: 'email-delivery',
    title: 'Class messages are not reaching learners',
    requester: 'Ms. Ada Nwosu',
    requesterRole: 'Teacher',
    detail:
      'Messages show “sent” in the dashboard, but no learner or parent has received an email or in-app alert since Friday. Her JSS3 Physics class has missed two assignment reminders.',
    opened: 'Today, 8:05 AM',
    due: 'Today, 12:00 PM',
    priority: 'high',
    status: 'open',
  },
  {
    id: 't3',
    area: 'subscription-approval',
    title: 'Special Needs payment not approved',
    requester: 'Mrs. Ngozi Bakare',
    requesterRole: 'Parent',
    detail:
      '₦22,000 paid through Paystack two days ago for Chidi’s Special Needs plan. The receipt shows success but the child account is still locked to the free tier.',
    opened: 'Today, 7:32 AM',
    due: 'Today, 10:00 AM',
    priority: 'high',
    status: 'open',
  },
  {
    id: 't4',
    area: 'cancellation',
    title: 'Cancel Premium before the renewal date',
    requester: 'Mr. Femi Achebe',
    requesterRole: 'Parent',
    detail:
      'Asked to stop Amaka’s Premium renewal on 6 November, four days before billing. He wants written confirmation that no charge will be attempted and access ends after the paid month.',
    opened: 'Yesterday, 5:18 PM',
    due: 'Today, 4:00 PM',
    priority: 'medium',
    status: 'in_progress',
  },
  {
    id: 't5',
    area: 'child-access',
    title: 'Cannot open child’s performance report',
    requester: 'Mrs. Bisi Nwosu',
    requesterRole: 'Parent',
    detail:
      'Parent Access shows “No data” for Blessing in SSS2 Commercial, even though the class teacher shared a report last week. She needs it before the parent-teacher call on Thursday.',
    opened: 'Yesterday, 2:46 PM',
    due: 'Today, 5:00 PM',
    priority: 'high',
    status: 'in_progress',
  },
  {
    id: 't6',
    area: 'special-needs',
    title: 'Requesting a special-needs tutor',
    requester: 'Mrs. Chidinma Eze',
    requesterRole: 'Parent',
    detail:
      'Needs an ASD specialist for 10-year-old Chidi, three sessions a week, mornings preferred. She asked for a female tutor with experience in non-verbal communication.',
    opened: 'Yesterday, 11:02 AM',
    due: 'Tue, 5 Nov',
    priority: 'medium',
    status: 'open',
  },
  {
    id: 't7',
    area: 'email-delivery',
    title: 'Verification email never arrived',
    requester: 'Mr. Chuka Obi',
    requesterRole: 'Parent',
    detail:
      'Account created six hours ago and the confirmation email is missing from inbox and spam. He cannot add his son until the address is verified.',
    opened: 'Yesterday, 9:24 AM',
    due: 'Today, 3:00 PM',
    priority: 'medium',
    status: 'open',
  },
  {
    id: 't8',
    area: 'teacher-dashboard',
    title: 'Tutor earnings page shows blank figures',
    requester: 'Ms. Sarah',
    requesterRole: 'Tutor',
    detail:
      'Earnings and payout history are empty since the November cycle began, although October sessions are recorded. She wants the figures before the payout run on the 5th.',
    opened: 'Mon, 4:12 PM',
    due: 'Tue, 4 Nov',
    priority: 'low',
    status: 'resolved',
  },
]

/* -------------------------------- Products -------------------------------- */

export type ProductKind = 'course' | 'bundle' | 'add-on' | 'resource' | 'exam-pack'

export interface AdminProduct {
  id: string
  name: string
  kind: ProductKind
  category: string
  price: number
  sold: number
  revenue: number
  rating: number
  growth: number
  status: 'live' | 'draft'
}

export const seedProducts: AdminProduct[] = [
  { id: 'pr1', name: 'JSS Mathematics Booster Pack', kind: 'resource', category: 'Mathematics', price: 6500, sold: 412, revenue: 2678000, rating: 4.9, growth: 18, status: 'live' },
  { id: 'pr2', name: 'WAEC Physics Exam Pack', kind: 'exam-pack', category: 'Physics', price: 9500, sold: 268, revenue: 2546000, rating: 4.8, growth: 12, status: 'live' },
  { id: 'pr3', name: 'Senior Science Mastery Bundle', kind: 'bundle', category: 'Science', price: 45000, sold: 84, revenue: 3780000, rating: 4.9, growth: 9, status: 'live' },
  { id: 'pr4', name: 'Special Needs Home Kit', kind: 'add-on', category: 'Special needs', price: 28000, sold: 96, revenue: 2688000, rating: 4.7, growth: 22, status: 'live' },
  { id: 'pr5', name: 'Coding Foundations Course', kind: 'course', category: 'Coding', price: 18000, sold: 123, revenue: 2214000, rating: 4.6, growth: 7, status: 'live' },
  { id: 'pr6', name: 'JSS English Comprehension Set', kind: 'resource', category: 'English', price: 5500, sold: 193, revenue: 1061500, rating: 4.8, growth: 5, status: 'live' },
  { id: 'pr7', name: 'Parent Exam-Prep Workshop', kind: 'add-on', category: 'Wellbeing', price: 12000, sold: 64, revenue: 768000, rating: 4.5, growth: -3, status: 'live' },
  { id: 'pr8', name: 'Art & Music Discovery Pack', kind: 'resource', category: 'Art & Music', price: 7500, sold: 44, revenue: 330000, rating: 4.6, growth: 4, status: 'draft' },
]

export const productSalesStats = {
  totalSales: 16065500,
  totalPurchases: 1284,
  totalPaid: 14320000,
  totalCosts: 7585500,
  profit: 6480000,
  mostSold: 'JSS Mathematics Booster Pack',
  mostSoldUnits: 412,
  averageOrder: 12512,
}

export const salesTrend = [
  { label: 'Apr', sales: 980, profit: 390 },
  { label: 'May', sales: 1040, profit: 410 },
  { label: 'Jun', sales: 1180, profit: 470 },
  { label: 'Jul', sales: 1260, profit: 500 },
  { label: 'Aug', sales: 1420, profit: 570 },
  { label: 'Sep', sales: 1610, profit: 650 },
  { label: 'Oct', sales: 1830, profit: 740 },
  { label: 'Nov', sales: 1240, profit: 500 },
]

export const productCategoryShare = [
  { name: 'Bundles', value: 33, color: '#475569' },
  { name: 'Exam packs', value: 24, color: '#64748b' },
  { name: 'Resources', value: 21, color: '#94a3b8' },
  { name: 'Add-ons', value: 14, color: '#cbd5e1' },
  { name: 'Courses', value: 8, color: '#e2e8f0' },
]

export const salesChannels = [
  { name: 'Paystack card', value: 68, color: '#334155' },
  { name: 'Bank transfer', value: 20, color: '#64748b' },
  { name: 'Coupon checkout', value: 12, color: '#94a3b8' },
]

/* --------------------------------- Orders --------------------------------- */

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'failed'

export interface AdminOrder {
  id: string
  customer: string
  learner: string
  item: string
  date: string
  amount: number
  status: OrderStatus
  channel: 'Paystack' | 'Bank transfer' | 'Coupon'
}

export const seedOrders: AdminOrder[] = [
  { id: 'NB-2481', customer: 'Mrs. Ngozi Bakare', learner: 'Chidi Eze', item: 'Special Needs Home Kit', date: '3 Nov 2026', amount: 28000, status: 'paid', channel: 'Paystack' },
  { id: 'NB-2480', customer: 'Mr. Femi Achebe', learner: 'Amaka Achebe', item: 'WAEC Physics Exam Pack', date: '3 Nov 2026', amount: 9500, status: 'paid', channel: 'Bank transfer' },
  { id: 'NB-2479', customer: 'Mrs. Bisi Nwosu', learner: 'Blessing Nwosu', item: 'Senior Science Mastery Bundle', date: '2 Nov 2026', amount: 45000, status: 'pending', channel: 'Bank transfer' },
  { id: 'NB-2478', customer: 'Mrs. Chidinma Eze', learner: 'Chidi Eze', item: 'JSS Mathematics Booster Pack', date: '2 Nov 2026', amount: 6500, status: 'paid', channel: 'Paystack' },
  { id: 'NB-2477', customer: 'Mr. Chuka Obi', learner: 'Chinedu Obi', item: 'Coding Foundations Course', date: '1 Nov 2026', amount: 18000, status: 'refunded', channel: 'Paystack' },
  { id: 'NB-2476', customer: 'Mrs. Ngozi Bakare', learner: 'Tunde Bakare', item: 'JSS English Comprehension Set', date: '1 Nov 2026', amount: 5500, status: 'paid', channel: 'Coupon' },
  { id: 'NB-2475', customer: 'Mrs. Funke Adeyemi', learner: 'Seyi Adeyemi', item: 'WAEC Physics Exam Pack', date: '31 Oct 2026', amount: 9500, status: 'paid', channel: 'Paystack' },
  { id: 'NB-2474', customer: 'Mr. Femi Achebe', learner: 'Amaka Achebe', item: 'Parent Exam-Prep Workshop', date: '30 Oct 2026', amount: 12000, status: 'failed', channel: 'Paystack' },
  { id: 'NB-2473', customer: 'Mrs. Bisi Nwosu', learner: 'Blessing Nwosu', item: 'JSS Mathematics Booster Pack', date: '29 Oct 2026', amount: 6500, status: 'paid', channel: 'Coupon' },
  { id: 'NB-2472', customer: 'Mrs. Chidinma Eze', learner: 'Chidi Eze', item: 'Special Needs Home Kit', date: '28 Oct 2026', amount: 28000, status: 'paid', channel: 'Paystack' },
  { id: 'NB-2471', customer: 'Mr. Chuka Obi', learner: 'Chinedu Obi', item: 'Art & Music Discovery Pack', date: '27 Oct 2026', amount: 7500, status: 'pending', channel: 'Bank transfer' },
  { id: 'NB-2470', customer: 'Mrs. Funke Adeyemi', learner: 'Seyi Adeyemi', item: 'Senior Science Mastery Bundle', date: '26 Oct 2026', amount: 45000, status: 'paid', channel: 'Paystack' },
]

/* -------------------------------- Invoices -------------------------------- */

export type InvoiceKind = 'parent' | 'teacher'
export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft'

export interface AdminInvoice {
  id: string
  kind: InvoiceKind
  party: string
  email: string
  description: string
  period: string
  amount: number
  issued: string
  due: string
  status: InvoiceStatus
}

export const seedInvoices: AdminInvoice[] = [
  { id: 'INV-P-1042', kind: 'parent', party: 'Mrs. Ngozi Bakare', email: 'ngozi.bakare@gmail.com', description: 'Special Needs plan · Chidi Eze', period: 'November 2026', amount: 22000, issued: '1 Nov 2026', due: '9 Nov 2026', status: 'pending' },
  { id: 'INV-P-1041', kind: 'parent', party: 'Mrs. Ngozi Bakare', email: 'ngozi.bakare@gmail.com', description: 'General plan · Tunde Bakare', period: 'November 2026', amount: 8500, issued: '1 Nov 2026', due: '9 Nov 2026', status: 'paid' },
  { id: 'INV-P-1040', kind: 'parent', party: 'Mr. Femi Achebe', email: 'femi.achebe@gmail.com', description: 'Premium plan · Amaka Achebe', period: 'October 2026', amount: 15000, issued: '1 Oct 2026', due: '9 Oct 2026', status: 'overdue' },
  { id: 'INV-P-1039', kind: 'parent', party: 'Mrs. Bisi Nwosu', email: 'bisi.nwosu@gmail.com', description: 'General plan · Blessing Nwosu', period: 'November 2026', amount: 8500, issued: '1 Nov 2026', due: '24 Nov 2026', status: 'pending' },
  { id: 'INV-P-1038', kind: 'parent', party: 'Mrs. Chidinma Eze', email: 'chidinma.eze@gmail.com', description: 'Special Needs plan · Chidi Eze', period: 'October 2026', amount: 22000, issued: '1 Oct 2026', due: '9 Oct 2026', status: 'paid' },
  { id: 'INV-T-2087', kind: 'teacher', party: 'Dr. Kelechi Azu', email: 'kelechi.azu@neurobloom.ng', description: 'Platform commission · 86 tutoring sessions', period: 'October 2026', amount: 27900, issued: '1 Nov 2026', due: '7 Nov 2026', status: 'pending' },
  { id: 'INV-T-2086', kind: 'teacher', party: 'Ms. Ada Nwosu', email: 'ada.nwosu@neurobloom.ng', description: 'Platform commission · 71 tutoring sessions', period: 'October 2026', amount: 21300, issued: '1 Nov 2026', due: '7 Nov 2026', status: 'pending' },
  { id: 'INV-T-2085', kind: 'teacher', party: 'Ms. Sarah', email: 'sarah@neurobloom.ng', description: 'Specialist commission · 52 ASD sessions', period: 'October 2026', amount: 14700, issued: '1 Nov 2026', due: '7 Nov 2026', status: 'paid' },
  { id: 'INV-T-2084', kind: 'teacher', party: 'Mr. Emeka', email: 'emeka@neurobloom.ng', description: 'Specialist commission · 38 art-therapy sessions', period: 'October 2026', amount: 9600, issued: '1 Nov 2026', due: '7 Nov 2026', status: 'overdue' },
  { id: 'INV-T-2083', kind: 'teacher', party: 'Mrs. Adaeze', email: 'adaeze@neurobloom.ng', description: 'Behavioural coaching · September payout', period: 'September 2026', amount: 10650, issued: '1 Oct 2026', due: '7 Oct 2026', status: 'paid' },
]

/* -------------------------------- Payroll --------------------------------- */

export interface AdminPayrollRow {
  id: string
  teacher: string
  role: string
  subject: string
  sessions: number
  hours: number
  gross: number
  fee: number
  net: number
  period: string
  status: 'due' | 'paid' | 'on_hold'
}

export const seedPayroll: AdminPayrollRow[] = [
  { id: 'pay1', teacher: 'Dr. Kelechi Azu', role: 'Teacher', subject: 'Mathematics', sessions: 86, hours: 129, gross: 186000, fee: 27900, net: 158100, period: 'October 2026', status: 'due' },
  { id: 'pay2', teacher: 'Ms. Ada Nwosu', role: 'Teacher', subject: 'Physics', sessions: 71, hours: 106, gross: 142000, fee: 21300, net: 120700, period: 'October 2026', status: 'due' },
  { id: 'pay3', teacher: 'Mr. Adeyemi', role: 'Teacher', subject: 'Basic Science', sessions: 64, hours: 96, gross: 118000, fee: 17700, net: 100300, period: 'October 2026', status: 'due' },
  { id: 'pay4', teacher: 'Ms. Sarah', role: 'Specialist', subject: 'Speech therapy', sessions: 52, hours: 78, gross: 98000, fee: 14700, net: 83300, period: 'October 2026', status: 'due' },
  { id: 'pay5', teacher: 'Mr. Emeka', role: 'Specialist', subject: 'ASD support', sessions: 38, hours: 57, gross: 64000, fee: 9600, net: 54400, period: 'October 2026', status: 'on_hold' },
  { id: 'pay6', teacher: 'Mrs. Adaeze', role: 'Specialist', subject: 'Behavioural coaching', sessions: 42, hours: 63, gross: 71000, fee: 10650, net: 60350, period: 'September 2026', status: 'paid' },
  { id: 'pay7', teacher: 'Ms. Halima Bello', role: 'Teacher', subject: 'Wellbeing', sessions: 26, hours: 39, gross: 48000, fee: 7200, net: 40800, period: 'September 2026', status: 'paid' },
  { id: 'pay8', teacher: 'Mr. Ifeanyi Okonkwo', role: 'Teacher', subject: 'Biology & Chemistry', sessions: 31, hours: 46, gross: 56000, fee: 8400, net: 47600, period: 'September 2026', status: 'paid' },
]

/* -------------------------------- Feedback -------------------------------- */

export type FeedbackStatus = 'new' | 'reviewed' | 'actioned'

export interface AdminFeedback {
  id: string
  author: string
  role: string
  rating: number
  date: string
  category: string
  message: string
  status: FeedbackStatus
}

export const seedFeedback: AdminFeedback[] = [
  { id: 'f1', author: 'Mrs. Ngozi Bakare', role: 'Parent', rating: 5, date: '3 Nov 2026', category: 'Special needs', message: 'The ASD specialist understood Chidi from the first session. The daily photo updates are the highlight of my day.', status: 'new' },
  { id: 'f2', author: 'Mr. Femi Achebe', role: 'Parent', rating: 2, date: '2 Nov 2026', category: 'Billing', message: 'I cancelled Premium before renewal but I still received a reminder to pay. Please make the cancellation status clearer in the parent portal.', status: 'new' },
  { id: 'f3', author: 'Ms. Ada Nwosu', role: 'Teacher', rating: 4, date: '2 Nov 2026', category: 'Messaging', message: 'The class dashboard is excellent, but messages sometimes take minutes to reach learners. Email delivery needs a status indicator.', status: 'reviewed' },
  { id: 'f4', author: 'Mrs. Bisi Nwosu', role: 'Parent', rating: 4, date: '1 Nov 2026', category: 'Reports', message: 'Blessing’s performance report is exactly what I need before parent-teacher meetings. It would help to download it as a PDF.', status: 'reviewed' },
  { id: 'f5', author: 'Dr. Kelechi Azu', role: 'Teacher', rating: 5, date: '31 Oct 2026', category: 'Payroll', message: 'Payout breakdowns are clear and the 15% platform fee is easy to reconcile against my sessions.', status: 'actioned' },
  { id: 'f6', author: 'Mrs. Chidinma Eze', role: 'Parent', rating: 5, date: '30 Oct 2026', category: 'Tutoring', message: 'Requesting a special-needs tutor took two clicks. We were matched within a day.', status: 'actioned' },
  { id: 'f7', author: 'Mr. Chuka Obi', role: 'Parent', rating: 1, date: '29 Oct 2026', category: 'Accounts', message: 'The verification email never arrived and I could not add my son for hours. Please fix account emails.', status: 'new' },
  { id: 'f8', author: 'Tunde Bakare', role: 'Student', rating: 4, date: '28 Oct 2026', category: 'Learning', message: 'The fractions booster pack is great. I would love more practice questions with worked solutions.', status: 'reviewed' },
]

/* --------------------------------- Support -------------------------------- */

export type SupportStatus = 'open' | 'waiting' | 'resolved'

export interface SupportTicket {
  id: string
  subject: string
  requester: string
  role: string
  priority: 'urgent' | 'high' | 'normal'
  opened: string
  updated: string
  status: SupportStatus
  excerpt: string
}

export const seedSupportTickets: SupportTicket[] = [
  { id: 'SUP-512', subject: 'Live class dashboard will not load', requester: 'Mr. Ifeanyi Okonkwo', role: 'Teacher', priority: 'urgent', opened: '3 Nov 2026', updated: '7 min ago', status: 'open', excerpt: 'SSS1 Physics dashboard spins indefinitely; 24 learners waiting for the 09:00 lesson.' },
  { id: 'SUP-509', subject: 'Special Needs payment not applied', requester: 'Mrs. Ngozi Bakare', role: 'Parent', priority: 'urgent', opened: '3 Nov 2026', updated: '31 min ago', status: 'open', excerpt: 'Paystack receipt shows ₦22,000 received but Chidi’s account is still on the free tier.' },
  { id: 'SUP-507', subject: 'Class messages not delivered', requester: 'Ms. Ada Nwosu', role: 'Teacher', priority: 'high', opened: '3 Nov 2026', updated: '1 hr ago', status: 'open', excerpt: 'Assignment reminders show as sent but no learner or parent received them.' },
  { id: 'SUP-504', subject: 'Parent Access shows no performance data', requester: 'Mrs. Bisi Nwosu', role: 'Parent', priority: 'high', opened: '2 Nov 2026', updated: '4 hrs ago', status: 'waiting', excerpt: 'Blessing’s SSS2 Commercial report is missing from the parent portal.' },
  { id: 'SUP-501', subject: 'Cancel Premium before 6 November', requester: 'Mr. Femi Achebe', role: 'Parent', priority: 'normal', opened: '2 Nov 2026', updated: 'Yesterday', status: 'waiting', excerpt: 'Wants written confirmation that no renewal charge will be attempted.' },
  { id: 'SUP-498', subject: 'Verified email never received', requester: 'Mr. Chuka Obi', role: 'Parent', priority: 'high', opened: '2 Nov 2026', updated: 'Yesterday', status: 'open', excerpt: 'Confirmation email missing from inbox and spam; cannot add a second child.' },
  { id: 'SUP-494', subject: 'Request for ASD tutor — mornings', requester: 'Mrs. Chidinma Eze', role: 'Parent', priority: 'normal', opened: '1 Nov 2026', updated: '2 days ago', status: 'waiting', excerpt: 'Three sessions a week for a 10-year-old; prefers a female specialist.' },
  { id: 'SUP-489', subject: 'Tutor earnings page blank', requester: 'Ms. Sarah', role: 'Tutor', priority: 'normal', opened: '30 Oct 2026', updated: '2 days ago', status: 'resolved', excerpt: 'November payout figures were missing; the finance cache was refreshed.' },
]

/* ---------------------------- Growth & reports ---------------------------- */

export const customerGrowth = [
  { label: 'Apr', parents: 2140, teachers: 96 },
  { label: 'May', parents: 2280, teachers: 102 },
  { label: 'Jun', parents: 2410, teachers: 108 },
  { label: 'Jul', parents: 2580, teachers: 112 },
  { label: 'Aug', parents: 2710, teachers: 121 },
  { label: 'Sep', parents: 2860, teachers: 132 },
  { label: 'Oct', parents: 2990, teachers: 140 },
  { label: 'Nov', parents: 3120, teachers: 148 },
]

export interface AdminReport {
  id: string
  title: string
  description: string
  cadence: string
  lastRun: string
  owner: string
  format: 'PDF' | 'CSV' | 'XLSX'
}

export const reportCatalogue: AdminReport[] = [
  { id: 'rep1', title: 'Product sales report', description: 'Units sold, gross sales, discounts and profit by product and month.', cadence: 'Monthly', lastRun: '1 Nov 2026', owner: 'Finance', format: 'XLSX' },
  { id: 'rep2', title: 'Parent invoice register', description: 'Every subscription invoice issued, paid, overdue or written off.', cadence: 'Weekly', lastRun: '1 Nov 2026', owner: 'Finance', format: 'CSV' },
  { id: 'rep3', title: 'Teacher payroll summary', description: 'Sessions, gross earnings, platform fee and net payout per teacher.', cadence: 'Monthly', lastRun: '1 Nov 2026', owner: 'Payroll', format: 'XLSX' },
  { id: 'rep4', title: 'Customer growth', description: 'New parents, teachers and specialists, with retention by cohort.', cadence: 'Monthly', lastRun: '31 Oct 2026', owner: 'Growth', format: 'PDF' },
  { id: 'rep5', title: 'Product statistics', description: 'Category mix, best sellers, ratings and refund rate by product.', cadence: 'Monthly', lastRun: '31 Oct 2026', owner: 'Product', format: 'PDF' },
  { id: 'rep6', title: 'Support and complaints log', description: 'Ticket volume, first response and resolution time by category.', cadence: 'Weekly', lastRun: '2 Nov 2026', owner: 'Support', format: 'CSV' },
]

export const recentReports = [
  { id: 'dl1', name: 'October product sales · XLSX', by: 'Zainab Yusuf', date: '1 Nov 2026', size: '284 KB' },
  { id: 'dl2', name: 'October teacher payroll · XLSX', by: 'Zainab Yusuf', date: '1 Nov 2026', size: '196 KB' },
  { id: 'dl3', name: 'Customer growth · Q3 PDF', by: 'Ade Martins', date: '31 Oct 2026', size: '1.2 MB' },
  { id: 'dl4', name: 'Support complaints log · CSV', by: 'Zainab Yusuf', date: '2 Nov 2026', size: '88 KB' },
]

export const adminActivity = [
  { id: 'a1', time: 'Today, 8:52 AM', actor: 'Zainab Yusuf', action: 'Reassigned SUP-512 to the platform engineering queue' },
  { id: 'a2', time: 'Today, 8:20 AM', actor: 'Zainab Yusuf', action: 'Approved 2 teacher accounts pending safeguarding checks' },
  { id: 'a3', time: 'Yesterday, 6:04 PM', actor: 'Ade Martins', action: 'Issued a ₦15,000 refund for NB-2477' },
  { id: 'a4', time: 'Yesterday, 2:31 PM', actor: 'Zainab Yusuf', action: 'Confirmed early cancellation for Amaka Achebe' },
  { id: 'a5', time: 'Mon, 11:12 AM', actor: 'Ade Martins', action: 'Published the Special Needs Home Kit product page' },
]
