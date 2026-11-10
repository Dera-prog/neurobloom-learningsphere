import type { PlanId } from './content'

export type AdminUserKind = 'student' | 'teacher' | 'specialist' | 'parent'
export type AdminUserStatus = 'active' | 'pending' | 'suspended'

export interface AdminUser {
  id: string
  name: string
  email: string
  kind: AdminUserKind
  detail: string
  status: AdminUserStatus
  verified: boolean
  joined: string
  plan?: PlanId
  /** Monthly plan value for students, in naira. */
  spend?: number
  rating?: number
}

export const seedAdminUsers: AdminUser[] = [
  { id: 'u1', name: 'Tunde Bakare', email: 'ngozi.bakare@gmail.com', kind: 'student', detail: 'JSS2 · Basic Science', status: 'active', verified: true, joined: 'Sep 2025', plan: 'general', spend: 8500 },
  { id: 'u2', name: 'Amaka Achebe', email: 'amaka.achebe@gmail.com', kind: 'student', detail: 'SSS3 · Science', status: 'active', verified: true, joined: 'Aug 2025', plan: 'premium', spend: 15000 },
  { id: 'u3', name: 'Chidi Eze', email: 'ngozi.bakare@gmail.com', kind: 'student', detail: 'Age 13 · ASD support', status: 'active', verified: true, joined: 'Oct 2025', plan: 'special', spend: 22000 },
  { id: 'u4', name: 'Blessing Nwosu', email: 'blessing.nwosu@yahoo.com', kind: 'student', detail: 'SSS2 · Commercial', status: 'active', verified: true, joined: 'Jan 2026', plan: 'general', spend: 8500 },
  { id: 'u5', name: 'Chinedu Obi', email: 'obi.family@gmail.com', kind: 'student', detail: 'JSS1 · General', status: 'suspended', verified: true, joined: 'Feb 2026' },
  { id: 'u6', name: 'Dr. Kelechi Azu', email: 'kelechi.azu@neurobloom.ng', kind: 'teacher', detail: 'Mathematics · 12 yrs', status: 'active', verified: true, joined: 'Mar 2024', rating: 4.9 },
  { id: 'u7', name: 'Ms. Ada Nwosu', email: 'ada.nwosu@neurobloom.ng', kind: 'teacher', detail: 'Physics · WAEC prep', status: 'active', verified: true, joined: 'Jun 2024', rating: 4.8 },
  { id: 'u8', name: 'Mr. Ifeanyi Okonkwo', email: 'ifeanyi.okonkwo@gmail.com', kind: 'teacher', detail: 'Biology & Chemistry', status: 'pending', verified: false, joined: 'Oct 2026' },
  { id: 'u9', name: 'Ms. Halima Bello', email: 'halima.bello@gmail.com', kind: 'specialist', detail: 'Speech & language therapy', status: 'pending', verified: false, joined: 'Oct 2026' },
  { id: 'u10', name: 'Ms. Sarah', email: 'sarah@neurobloom.ng', kind: 'specialist', detail: 'Speech therapist · ASD', status: 'active', verified: true, joined: 'Jan 2025', rating: 5 },
  { id: 'u11', name: 'Mr. Emeka', email: 'emeka@neurobloom.ng', kind: 'specialist', detail: 'ASD specialist · Art therapy', status: 'active', verified: true, joined: 'Feb 2025', rating: 4.9 },
  { id: 'u12', name: 'Mrs. Adaeze', email: 'adaeze@neurobloom.ng', kind: 'specialist', detail: 'Behavioural coach', status: 'active', verified: true, joined: 'Apr 2025', rating: 4.7 },
  { id: 'u13', name: 'Mrs. Ngozi Bakare', email: 'ngozi.bakare@gmail.com', kind: 'parent', detail: '2 children · General + Special', status: 'active', verified: true, joined: 'Sep 2025', plan: 'special', spend: 30500 },
  { id: 'u14', name: 'Mr. Femi Achebe', email: 'femi.achebe@gmail.com', kind: 'parent', detail: '1 child · Premium', status: 'suspended', verified: true, joined: 'Aug 2025', plan: 'premium', spend: 15000 },
]

export type ReviewKind = 'lesson' | 'resource' | 'discussion'
export type ReviewStatus = 'pending' | 'approved' | 'removed' | 'dismissed'

export interface AdminReview {
  id: string
  kind: ReviewKind
  title: string
  author: string
  subject: string
  submitted: string
  reports: number
  excerpt: string
  status: ReviewStatus
}

export const seedReviews: AdminReview[] = [
  {
    id: 'r1',
    kind: 'lesson',
    title: 'Photosynthesis: from sunlight to sugar',
    author: 'Mr. Ifeanyi Okonkwo',
    subject: 'Biology',
    submitted: 'Today, 9:14 AM',
    reports: 0,
    excerpt: 'A 22-minute lesson with a labelled diagram, three experiment prompts and a five-question exit quiz.',
    status: 'pending',
  },
  {
    id: 'r2',
    kind: 'resource',
    title: 'WAEC Physics past questions 2015–2024',
    author: 'Ms. Ada Nwosu',
    subject: 'Physics',
    submitted: 'Today, 8:02 AM',
    reports: 0,
    excerpt: 'PDF · 14 MB · 460 past questions with worked solutions and a topic index.',
    status: 'pending',
  },
  {
    id: 'r3',
    kind: 'discussion',
    title: '“Cell Biology” lesson link reported',
    author: 'Anonymous parent',
    subject: 'Biology',
    submitted: 'Yesterday, 6:40 PM',
    reports: 3,
    excerpt: 'A parent says the lesson links to an unverified external file host. Please confirm the source before students open it.',
    status: 'pending',
  },
  {
    id: 'r4',
    kind: 'lesson',
    title: 'Fraction games for JSS1',
    author: 'Mr. Adeyemi',
    subject: 'Mathematics',
    submitted: 'Yesterday, 2:18 PM',
    reports: 0,
    excerpt: 'Interactive fraction puzzles with a printable worksheet for learners who prefer paper.',
    status: 'pending',
  },
  {
    id: 'r5',
    kind: 'resource',
    title: 'Exam anxiety toolkit for parents',
    author: 'Ms. Halima Bello',
    subject: 'Wellbeing',
    submitted: 'Mon, 10:05 AM',
    reports: 0,
    excerpt: 'A one-page guide with breathing exercises and conversation starters ahead of WAEC.',
    status: 'pending',
  },
  {
    id: 'r6',
    kind: 'lesson',
    title: 'Quadratic equations — completing the square',
    author: 'Dr. Kelechi Azu',
    subject: 'Mathematics',
    submitted: 'Sat, 11:30 AM',
    reports: 0,
    excerpt: 'Approved last week after review. Rated 4.8 by 32 students.',
    status: 'approved',
  },
  {
    id: 'r7',
    kind: 'discussion',
    title: 'Comment removed from JSS2 class chat',
    author: 'Tunde Bakare',
    subject: 'Class chat',
    submitted: 'Fri, 4:12 PM',
    reports: 5,
    excerpt: 'Contained a phone number asking classmates to move the conversation off-platform.',
    status: 'removed',
  },
]

export interface AdminPayout {
  id: string
  teacher: string
  period: string
  gross: number
  fee: number
  net: number
  status: 'due' | 'paid'
}

export const seedPayouts: AdminPayout[] = [
  { id: 'p1', teacher: 'Dr. Kelechi Azu', period: 'October 2026', gross: 186000, fee: 27900, net: 158100, status: 'due' },
  { id: 'p2', teacher: 'Ms. Ada Nwosu', period: 'October 2026', gross: 142000, fee: 21300, net: 120700, status: 'due' },
  { id: 'p3', teacher: 'Ms. Sarah', period: 'October 2026', gross: 98000, fee: 14700, net: 83300, status: 'due' },
  { id: 'p4', teacher: 'Mr. Emeka', period: 'October 2026', gross: 64000, fee: 9600, net: 54400, status: 'due' },
  { id: 'p5', teacher: 'Mrs. Adaeze', period: 'September 2026', gross: 71000, fee: 10650, net: 60350, status: 'paid' },
]

export interface AdminLedgerRow {
  id: string
  date: string
  parent: string
  child: string
  plan: PlanId
  amount: number
  coupon?: string
  status: 'success' | 'refunded' | 'failed'
}

export const seedLedger: AdminLedgerRow[] = [
  { id: 'l1', date: '1 Nov 2026', parent: 'Mrs. Ngozi Bakare', child: 'Chidi Eze', plan: 'special', amount: 22000, status: 'success' },
  { id: 'l2', date: '1 Nov 2026', parent: 'Mrs. Ngozi Bakare', child: 'Tunde Bakare', plan: 'general', amount: 8500, coupon: 'BLOOM10', status: 'success' },
  { id: 'l3', date: '28 Oct 2026', parent: 'Mr. Femi Achebe', child: 'Amaka Achebe', plan: 'premium', amount: 15000, status: 'failed' },
  { id: 'l4', date: '24 Oct 2026', parent: 'Mrs. Bisi Nwosu', child: 'Blessing Nwosu', plan: 'general', amount: 8500, status: 'success' },
  { id: 'l5', date: '20 Oct 2026', parent: 'Mr. Femi Achebe', child: 'Amaka Achebe', plan: 'premium', amount: 15000, status: 'refunded' },
  { id: 'l6', date: '14 Oct 2026', parent: 'Mrs. Ngozi Bakare', child: 'Chidi Eze', plan: 'special', amount: 22000, status: 'success' },
  { id: 'l7', date: '9 Oct 2026', parent: 'Mr. Chuka Obi', child: 'Chinedu Obi', plan: 'general', amount: 8500, status: 'refunded' },
  { id: 'l8', date: '3 Oct 2026', parent: 'Mrs. Ngozi Bakare', child: 'Tunde Bakare', plan: 'general', amount: 8500, status: 'success' },
]

export interface AdminSubscription {
  id: string
  child: string
  parent: string
  plan: PlanId
  amount: number
  next: string
  status: 'active' | 'past_due' | 'cancelled'
}

export const seedSubscriptions: AdminSubscription[] = [
  { id: 's1', child: 'Tunde Bakare', parent: 'Mrs. Ngozi Bakare', plan: 'general', amount: 8500, next: '9 Nov 2026', status: 'active' },
  { id: 's2', child: 'Chidi Eze', parent: 'Mrs. Ngozi Bakare', plan: 'special', amount: 22000, next: '14 Nov 2026', status: 'active' },
  { id: 's3', child: 'Amaka Achebe', parent: 'Mr. Femi Achebe', plan: 'premium', amount: 15000, next: '—', status: 'past_due' },
  { id: 's4', child: 'Blessing Nwosu', parent: 'Mrs. Bisi Nwosu', plan: 'general', amount: 8500, next: '24 Nov 2026', status: 'active' },
  { id: 's5', child: 'Chinedu Obi', parent: 'Mr. Chuka Obi', plan: 'general', amount: 8500, next: '—', status: 'cancelled' },
]

export const revenueTrend = [
  { label: 'Apr', revenue: 1840, payouts: 720 },
  { label: 'May', revenue: 2010, payouts: 810 },
  { label: 'Jun', revenue: 2280, payouts: 940 },
  { label: 'Jul', revenue: 2410, payouts: 980 },
  { label: 'Aug', revenue: 2620, payouts: 1060 },
  { label: 'Sep', revenue: 2870, payouts: 1180 },
  { label: 'Oct', revenue: 3050, payouts: 1240 },
  { label: 'Nov', revenue: 3320, payouts: 1320 },
]

export const studentGrowth = [
  { label: 'Apr', students: 3120 },
  { label: 'May', students: 3380 },
  { label: 'Jun', students: 3610 },
  { label: 'Jul', students: 3820 },
  { label: 'Aug', students: 4040 },
  { label: 'Sep', students: 4310 },
  { label: 'Oct', students: 4580 },
  { label: 'Nov', students: 4820 },
]

export const teacherGrowth = [
  { label: 'Apr', hired: 12 },
  { label: 'May', hired: 14 },
  { label: 'Jun', hired: 11 },
  { label: 'Jul', hired: 17 },
  { label: 'Aug', hired: 15 },
  { label: 'Sep', hired: 19 },
  { label: 'Oct', hired: 16 },
  { label: 'Nov', hired: 21 },
]

export const weeklyActivity = [
  { label: 'Mon', lessons: 420, quizzes: 310 },
  { label: 'Tue', lessons: 460, quizzes: 360 },
  { label: 'Wed', lessons: 512, quizzes: 402 },
  { label: 'Thu', lessons: 488, quizzes: 388 },
  { label: 'Fri', lessons: 540, quizzes: 430 },
  { label: 'Sat', lessons: 322, quizzes: 268 },
  { label: 'Sun', lessons: 244, quizzes: 196 },
]

export const retentionCohorts = [
  { cohort: 'Jun 2026', size: 3610, d30: 94, d60: 88, d90: 81 },
  { cohort: 'Jul 2026', size: 3820, d30: 93, d60: 87, d90: 80 },
  { cohort: 'Aug 2026', size: 4040, d30: 95, d60: 89, d90: 83 },
  { cohort: 'Sep 2026', size: 4310, d30: 95, d60: 90, d90: 0 },
  { cohort: 'Oct 2026', size: 4580, d30: 96, d60: 0, d90: 0 },
]

export const teacherPerformance = [
  { id: 't1', name: 'Dr. Kelechi Azu', subject: 'Mathematics', rating: 4.9, sessions: 86, response: '12 min', completion: 98, earnings: 186000 },
  { id: 't2', name: 'Ms. Ada Nwosu', subject: 'Physics', rating: 4.8, sessions: 71, response: '18 min', completion: 96, earnings: 142000 },
  { id: 't3', name: 'Mr. Adeyemi', subject: 'Basic Science', rating: 4.7, sessions: 64, response: '24 min', completion: 94, earnings: 118000 },
  { id: 't4', name: 'Ms. Sarah', subject: 'Speech therapy', rating: 5, sessions: 52, response: '9 min', completion: 99, earnings: 98000 },
  { id: 't5', name: 'Mr. Emeka', subject: 'ASD support', rating: 4.9, sessions: 38, response: '15 min', completion: 97, earnings: 64000 },
]

export const platformCategories = ['Mathematics', 'English', 'Basic Science', 'Physics', 'Chemistry', 'Biology', 'Coding', 'Art & Music']

export const platformStats = {
  students: 4820,
  parents: 3120,
  teachers: 148,
  specialists: 36,
  mrr: 7412000,
  collected: 8124000,
  refunds: 45000,
  growth: 5.2,
}
